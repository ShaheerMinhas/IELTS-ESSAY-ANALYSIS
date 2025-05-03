import React, { useState, useEffect, useCallback, useRef } from "react";

const Home = () => {
  const [text, setText] = useState("");
  const [tempText, setTempText] = useState("");
  const [timedText, setTimedText] = useState([]);
  const [loggedText, setLoggedText] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15 * 60); // 15 minutes
  const [timerStarted, setTimerStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const user_id = Date.now().toString(36).slice(-4); // 4-char ID
  const textRef = useRef(text);
  const elapsedRef = useRef(0);

  const backspaceSession = useRef({
    isActive: false,
    bufferBefore: "",
    timeoutId: null,
  });

  // Send keylog/snapshot to LLM API
  const sendToLLM = async (payload, endpoint = "llm-log") => {
    try {
      await fetch(`http://127.0.0.1:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          ...payload,
        }),
      });
    } catch (error) {
      console.error("Failed to send update to LLM:", error);
    }
  };

  // Fetch prompt & start timer
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/prompt");
        const data = await response.json();
        setPrompt(data.prompt);
        setTimerStarted(true);
      } catch (error) {
        console.error("Error fetching prompt:", error);
      }
    };
    fetchPrompt();
  }, []);

  // Timer + auto-submit once
  useEffect(() => {
    if (!timerStarted || submitted) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // auto-submit once
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, submitted]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Update textRef whenever text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Snapshot every 3 minutes
  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      elapsedRef.current += 180;
      const label = `${elapsedRef.current / 60}-minute snapshot`;
      const snapshot = { label, text: textRef.current };
      setTimedText((prev) => [...prev, snapshot]);
      sendToLLM({ type: "snapshot", ...snapshot });
    }, 180000); // every 3 minutes

    return () => clearInterval(interval);
  }, [timerStarted]);

  // Keylog handling
  const handleKeyDown = useCallback(
    (e) => {
      textRef.current = text;

      if (e.key === "Backspace") {
        if (!backspaceSession.current.isActive) {
          backspaceSession.current.isActive = true;
          backspaceSession.current.bufferBefore = textRef.current;
        }

        clearTimeout(backspaceSession.current.timeoutId);
        backspaceSession.current.timeoutId = setTimeout(() => {
          if (backspaceSession.current.isActive) {
            backspaceSession.current.isActive = false;
            const bufferAfter = textRef.current;
            const log = {
              event: "backspace-revision-timeout",
              timestamp: new Date().toISOString(),
              bufferBefore: backspaceSession.current.bufferBefore,
              bufferAfter,
            };
            setLoggedText((prev) => [...prev, log]);
            sendToLLM({ type: "keylog", ...log });
          }
        }, 3000);
      } else {
        if (backspaceSession.current.isActive) {
          backspaceSession.current.isActive = false;
          clearTimeout(backspaceSession.current.timeoutId);
          const bufferAfter = textRef.current;
          const log = {
            event: "backspace-revision",
            timestamp: new Date().toISOString(),
            bufferBefore: backspaceSession.current.bufferBefore,
            bufferAfter,
            nextKey: e.key,
          };
          setLoggedText((prev) => [...prev, log]);
          sendToLLM({ type: "keylog", ...log });
        }
      }
    },
    [text]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleSubmit = async () => {
    if (submitted) return; // prevent multiple submissions
    if (!text.trim()) {
      alert("Please write something before submitting.");
      return;
    }

    setSubmitted(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          essay: text,
          snapshot: timedText,
          score,
          keylogs: loggedText,
          user_id,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit.");
      const result = await response.json();
      console.log("Submitted:", result);
      alert("Essay submitted!");
    } catch (error) {
      console.error("Submit error:", error);
      alert("Submission failed.");
    }
  };

  return (
    <>
      <div style={{ marginTop: "2%", textAlign: "center" }}>
        <h2>{prompt || "Loading prompt..."}</h2>
        {timerStarted && (
          <div style={{ fontSize: "20px", marginTop: "10px", color: "darkred" }}>
            Time Remaining: {formatTime(timer)}
          </div>
        )}
      </div>

      <div style={{ marginTop: "2%", height: "550px" }}>
        <textarea
          placeholder="Write your essay here..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setTempText(e.target.value);
          }}
          disabled={submitted || timer === 0}
          style={{
            width: "100%",
            height: "100%",
            border: "3px solid black",
            borderRadius: "4px",
            padding: "10px",
            boxSizing: "border-box",
            fontSize: "16px",
            resize: "none",
            backgroundColor: submitted || timer === 0 ? "#eee" : "white",
          }}
        />
      </div>

      <div style={{ marginTop: "1%", textAlign: "left" }}>
        <button onClick={handleSubmit} disabled={submitted}>
          Submit
        </button>
      </div>
    </>
  );
};

export default Home;
