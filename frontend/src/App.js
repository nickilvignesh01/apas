import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Courses from "./components/courses";
import AddNewCourse from "./components/AddNewCourse";
import Assessments from "./components/Assessments";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Navbar from "./components/Navbar";

const AppContent = () => {
  const [courses, setCourses] = useState([]);
  const location = useLocation(); // Now it's inside the Router context

  const handleAddCourse = (newCourse) => {
    setCourses([...courses, newCourse]);
  };

  return (
    <>
      {location.pathname !== "/login" && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses courses={courses} />} />
        <Route path="/add-course" element={<AddNewCourse onAddCourse={handleAddCourse} />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
