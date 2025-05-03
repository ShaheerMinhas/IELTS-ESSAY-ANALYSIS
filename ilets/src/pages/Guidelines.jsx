import React from "react";
import { useNavigate } from "react-router-dom";

const Guidelines = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "5%", lineHeight: "1.7" }}>
      <h2>Essay Writing Guidelines</h2>
      <p><strong>Objective:</strong><br />
        You will write a short English essay based on a prompt. This is part of a study to understand how students think, write, and revise during essay writing.
      </p>

      <p><strong>Time Limit:</strong> 15 minutes<br />
        <strong>Word Limit:</strong> 200–300 words
      </p>

      <p><strong>Instructions:</strong><br />
        - Type your essay in the textbox.<br />
        - You may revise and delete text.<br />
        - Spell check and grammar correction are disabled.
      </p>

      <h3>Participant Information & Data Use Guidelines:</h3>
      <ul>
        <li>Your keystrokes, pauses, and edits during the essay activity will be logged for research purposes.</li>
        <li>Periodic snapshots of your essay-in-progress may be captured (with your prior consent).</li>
        <li>No personal data (e.g., name, email, passwords) will be collected unless you explicitly provide it.</li>
        <li>Please avoid entering any sensitive information (e.g., passwords, login details), as all keyboard input is recorded.</li>
        <li>Your data will be fully anonymized before analysis, ensuring that no individual can be identified from the research results.</li>
        <li>All data will be stored securely in an encrypted environment and deleted after the completion of the study.</li>
        <li>Participation is voluntary. You may withdraw at any time without penalty and without giving a reason.</li>
        <li>This study complies with ethical guidelines for human-computer interaction research and respects your digital privacy rights.</li>
      </ul>

      <p><strong>Tips:</strong><br />
        Use simple, clear language. Follow the structure: Introduction → Body → Conclusion.
      </p>

      <p>By continuing, you agree to participate voluntarily in this study.</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/essay")}>Start Essay</button>
        <button onClick={() => alert("Thank you! You may close this tab.")} style={{ marginLeft: "10px" }}>I Do Not Wish to Participate</button>
      </div>
    </div>
  );
};

export default Guidelines;
