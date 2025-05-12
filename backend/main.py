from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import base64
import time
import json
import requests
import random
from typing import List, Dict, Union
import google.generativeai as genai

# Cloudinary configuration
CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dzfoiqap7/raw/upload"
CLOUDINARY_UPLOAD_PRESET = "nlp-ielts"  # Replace with actual preset name

# Initialize app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can change this to specific origins
    allow_credentials=True,
    allow_methods=["*"],  # This allows all HTTP methods like GET, POST, etc.
    allow_headers=["*"],  # This allows all headers
)


# Setup directories
IMAGES_DIR = Path("images")
IMAGES_DIR.mkdir(exist_ok=True)
genai.configure(api_key="AIzaSyA-_vDMMyHnv77Bf9oZ6JxmapzEGcO5ArI")

# Models
class Snapshot(BaseModel):
    label: str
    text: str

class ReportData(BaseModel):
    topic: str
    essay: str
    snapshot: List[Snapshot]
    score: float
    keylogs: List[Dict[str, Union[str, float]]] = []
    user_id: Union[str, None] = None

# Upload utility
def upload_to_cloudinary(file_path: Path, folder: str = "default") -> Union[str, None]:
    try:
        with open(file_path, "rb") as file:
            files = {"file": file}
            data = {
                "upload_preset": CLOUDINARY_UPLOAD_PRESET,
                "folder": folder
            }
            response = requests.post(CLOUDINARY_UPLOAD_URL, files=files, data=data)
            if response.status_code == 200:
                return response.json().get("secure_url")
            else:
                print(f"Cloudinary upload failed: {response.text}")
                return None
    except Exception as e:
        print("Upload error:", e)
        return None

# Report Endpoint
@app.post("/report")
async def get_report(data: ReportData):
    user_id = data.user_id or str(int(time.time()))
    user_dir = Path("data") / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Save snapshots
    snapshot_file = user_dir / f"snapshots_{user_id}.txt"
    with open(snapshot_file, "w", encoding="utf-8") as f:
        for snap in data.snapshot:
            f.write(f"{snap.label}:\n{snap.text}\n\n")

    # Save keylogs
    keylog_file = user_dir / f"keylogs_{user_id}.json"
    with open(keylog_file, "w", encoding="utf-8") as f:
        json.dump(data.keylogs, f, indent=4)

    # Save essay text and JSON
    essay_text_file = user_dir / f"final_essay_{user_id}.txt"
    essay_json_file = user_dir / f"final_essay_{user_id}.json"
    with open(essay_text_file, "w", encoding="utf-8") as f:
        f.write(data.essay)
    with open(essay_json_file, "w", encoding="utf-8") as f:
        json.dump({"essay": data.essay, "score": data.score}, f, indent=4)

    # Generate feedback report using Gemini
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
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
    - Provide a 1–2 sentence justification, quoting or paraphrasing the rubric language. At the end of each section, offer one sentence suggesting a specific practice or strategy for improvement based on the student’s revision behavior.
    PART-2: Revision Potential (Analytic Feedback Rubric Best Practices. Include insights into writing behaviour)
    Please highlight specific insights based on how the essay evolved — e.g., major rewrites, moments of hesitation, or structural revisions. Reference keystrokes, pauses, or snapshot differences **only where meaningful** to explain the student’s development and revision patterns. In your evaluation, use meaningful writing process evidence to support your analysis. Reference notable pauses, revision bursts, rewriting patterns, or changes in structure or argument—especially where they reflect decision-making, confusion, or problem-solving. Compare early and late versions of paragraphs to detect deeper revisions such as restructuring of ideas, evolution of tone, or shifts in argumentative strategy. If long pauses or multiple rewrites are observed near the introduction or conclusion, consider whether the student faced uncertainty, cognitive overload, or emotional hesitation in expressing their ideas.
    Avoid naming or referencing any specific scoring rubrics or educational frameworks. Do not use any formatting such as bold or asterisks. Write in plain, clear English.
    Assume the student is a language learner. Keep the tone neutral, constructive, and focused on learning potential. Limit each section to 2–4 sentences and Revision section to 5-6 sentences. Avoid generic commentary; instead, interpret the writing behavior to reveal cognitive and compositional development. Only discuss spelling or grammar issues if they remained in the final draft or if repeated errors indicate deeper difficulties with language mastery. 
    """
)
    feedback = response.text

    report_file = user_dir / f"report_{user_id}.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(feedback)

    # Upload all files to Cloudinary
    folder_name = f"reports/{user_id}"
    files = [snapshot_file, keylog_file, essay_text_file, essay_json_file, report_file]
    cloudinary_links = {}
    for file in files:
        url = upload_to_cloudinary(file, folder=folder_name)
        if url:
            cloudinary_links[file.name] = url

    return {
        "report": feedback,
        "files": cloudinary_links
    }

# Prompt Endpoint
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
    random.seed(time.time())
    return {"prompt": random.choice(topics)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
