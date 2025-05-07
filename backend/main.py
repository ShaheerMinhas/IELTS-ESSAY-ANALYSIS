from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
from pathlib import Path
import time
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import google.generativeai as genai
import os
from typing import List, Dict, Union
import json
from pydantic.v1.types import JsonMeta

from utils import get_image_paths, delete_image

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "https://essaylogger.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
IMAGES_DIR = Path("images")
IMAGES_DIR.mkdir(exist_ok=True)
genai.configure(api_key="AIzaSyA-_vDMMyHnv77Bf9oZ6JxmapzEGcO5ArI")


class ImageData(BaseModel):
    image: str  # Base64 string

class Snapshot(BaseModel):
    label: str
    text: str

class ReportData(BaseModel):
    topic: str
    essay: str
    snapshot: List[Snapshot] 
    score: float
    keylogs: List[Dict[str, Union[str, float]]] = [] 
    user_id: str = None


# @app.post("/upload")
# async def save_image(data: ImageData):
#     try:
#         # Extract the base64 string and decode it
#         base64_image = data.image.replace("data:image/jpeg;base64,", "")
#         image_data = base64.b64decode(base64_image)

#         # Create a unique filename
#         filename = f"image_{int(time.time())}.jpeg"
#         filepath = IMAGES_DIR / filename

#         # Save the image to the folder
#         with open(filepath, "wb") as f:
#             f.write(image_data)

#         return {"message": "Image saved successfully", "filepath": str(filepath)}

#     except Exception as e:
#         print("Error saving image:", e)
#         raise HTTPException(status_code=500, detail="Failed to save image")


@app.post("/report")
async def get_report(data: ReportData):
    user_id = data.user_id or str(int(time.time()))
    user_dir = Path("data") / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Save snapshots
    snapshot_file = user_dir / f"snapshots_{user_id}.txt"
    with open(snapshot_file, "w", encoding="utf-8") as f:
        for i, snap in enumerate(data.snapshot):
            f.write(f"{snap.label}:\n{snap.text}\n\n")


    # Save keylogs as .json
    keylog_file = user_dir / f"keylogs_{user_id}.json"
    with open(keylog_file, "w", encoding="utf-8") as f:
        json.dump(data.keylogs, f, indent=4)

    # Save final essay as both .txt and .json
    essay_text_file = user_dir / f"final_essay_{user_id}.txt"
    with open(essay_text_file, "w", encoding="utf-8") as f:
        f.write(data.essay)

    essay_json_file = user_dir / f"final_essay_{user_id}.json"
    with open(essay_json_file, "w", encoding="utf-8") as f:
        json.dump({"essay": data.essay, "score": data.score}, f, indent=4)

    #generate report
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    print(data)
    response = model.generate_content(
    f"""
You are an expert university writing instructor and educational researcher. 
You are evaluating a timed student essay writing task. In addition to the final essay, you have access to the student's full writing process, including:

    - Essay Topic: {data.topic}
    - Final Essay: {data.essay}
    - Writing Snapshots (chronological captures of writing at different timestamps): {data.snapshot}
    - Keylogs (detailed edit history, including pauses, deletions, rewrites, backspaces, and changes over time): {data.keylogs}

    Your task is to provide structured feedback in five areas:

1. Thesis & Argumentation (AAC&U VALUE Written Communication)  
2. Organization & Structure (ETS TOEFL iBT Integrated Writing)  
3. Language Use (Jacobs’ ESL Composition Profile)  
4. Engagement with Prompt (ETS TOEFL iBT Independent Writing)  
For each criterion:
- Assign a 1–5 score aligning with the rubric’s performance descriptors.
- Provide a 1–2 sentence justification, quoting or paraphrasing the rubric language.
PART-2: Revision Potential (Analytic Feedback Rubric Best Practices. Include insights into writing behaviour)
Please highlight specific insights based on how the essay evolved — e.g., major rewrites, moments of hesitation, or structural revisions. Reference keystrokes, pauses, or snapshot differences **only where meaningful** to explain the student’s development and revision patterns. In your evaluation, use meaningful writing process evidence to support your analysis. Reference notable pauses, revision bursts, rewriting patterns, or changes in structure or argument—especially where they reflect decision-making, confusion, or problem-solving.
Avoid naming or referencing any specific scoring rubrics or educational frameworks. Do not use any formatting such as bold or asterisks. Write in plain, clear English.
Assume the student is a language learner. Keep the tone neutral, constructive, and focused on learning potential. Limit each section to 2–4 sentences and Revision section to 5-6 sentences. Avoid generic commentary; instead, interpret the writing behavior to reveal cognitive and compositional development.
"""
)

    print(response.text)
    
    # Save report
    report_file = user_dir / f"report_{user_id}.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(response.text)

    
    return {"report": response.text}

import random
import time

@app.get("/prompt")
async def get_prompt():
    topics = [
        # Argumentative / Opinion-Based
        "Should schools eliminate homework for better mental health?",
        "Is online learning as effective as traditional classroom learning?",
        "Should students be allowed to use AI tools during writing assignments?",
        "Can daily reading improve overall writing skills?",
        "Should smartphones be banned in classrooms?",
        # Descriptive / Reflective
        "Describe a place that has had a deep impact on you.",
        "A typical day in the life of a university student.",
        "Describe the most useful app or technology you use daily.",
        "Your experience learning something difficult and how you overcame it.",
        "The impact of music or art on your productivity and focus.",
        # Analytical / Expository
        "How social media affects students’ attention spans.",
        "The role of libraries in the digital age.",
        "The benefits and drawbacks of part-time jobs for students.",
        "The importance of writing by hand in the digital era.",
        "How technology is reshaping the future of education."
    ]
    
    # Use time as a seed to ensure randomness
    random.seed(time.time())
    prompt = random.choice(topics)
    
    return {"prompt": prompt}

