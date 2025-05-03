import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report || "No feedback available.";

  return (
    <div style={{ padding: "5%", lineHeight: "1.7", maxWidth: "800px", margin: "auto" }}>
      <h2>Essay Feedback Report</h2>
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
