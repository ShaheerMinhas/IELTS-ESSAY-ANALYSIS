import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report || "No feedback available.";
  const user_id = location.state?.user_id || "N/A";

  return (
    <div style={{ padding: "5%", lineHeight: "1.7", maxWidth: "800px", margin: "auto" }}>
      <h2>Essay Feedback Report</h2>
      <p><strong>User ID:</strong> {user_id}</p>
      <p style={{ fontStyle: "italic", color: "#555" }}>
        This feedback is based on your final essay, writing snapshots, and keylog behavior during the 15-minute task.
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          whiteSpace: "pre-wrap",
          backgroundColor: "#fafafa",
          marginTop: "20px"
        }}
      >
        {report}
      </div>

      <div style={{ marginTop: "40px", fontSize: "16px" }}>
        <p>
          We’d appreciate your feedback on this tool. Please fill out this short form:
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScH4szgpmupQ7NW4DkI_CmGiV925vsVCuaTGBCs7vce6ydtbg/viewform?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1a73e8", textDecoration: "underline" }}
        >
          Give Feedback via Google Form
        </a>
      </div>

      <div style={{ marginTop: "30px" }}>
        <button onClick={() => navigate("/")}>Back to Home</button>
        <button
          onClick={() => navigate("/essay")}
          style={{ marginLeft: "10px" }}
        >
          Write Another Essay
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;
