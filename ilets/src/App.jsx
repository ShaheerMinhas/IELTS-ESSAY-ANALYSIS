import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Guidelines from "./pages/Guidelines";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
const App = () => {
  return (
    <Router>
      <div className="flex">
        <ResponsiveAppBar />
        <Routes>
        <Route path="/" element={<Guidelines />} />
        <Route path="/essay" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
