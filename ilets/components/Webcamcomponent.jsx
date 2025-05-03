import React from "react";
import { useRef, useState } from "react";
import Webcam from "react-webcam";
const Webcamcomponent = () => {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState("");
  const capture = async () => {
    const image = webcamRef.current?.getScreenshot();
    setImageSrc(image || null);

    if (image) {
      try {
        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image }),
        });

        if (response.ok) {
          alert("Image saved successfully!");
        } else {
          alert("Failed to save image.");
        }
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };
  React.useEffect(() => {
    const interval = setInterval(() => {
      capture();
    }, 240000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
};

export default Webcamcomponent;
