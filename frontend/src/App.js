import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard.jsx";
import Courses from "./components/Courses.jsx";
import AddNewCourse from "./components/AddNewCourse.jsx";
import Assessments from "./components/Assessments.jsx";
import Profile from "./components/Profile.jsx";
import Login from "./components/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import MyClass from "./components/MyClass.jsx";
import CourseMenu from "./components/CourseMenu.jsx";
import Tutorials from "./components/Tutorials.jsx";
import MarkEntry from "./components/MarkEntry.jsx";
import Reports from "./components/Reports.jsx";
import Consolidate from "./components/Consolidate.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import ViewMarks from "./components/ViewMarks.jsx";

const AppContent = () => {
  const [courses, setCourses] = useState([]);
  const location = useLocation();

  const handleAddCourse = (newCourse) => {
    setCourses([...courses, newCourse]);
  };

  return (
    <>
      {location.pathname !== "/login" && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/courses" element={<PrivateRoute><Courses courses={courses} /></PrivateRoute>} />
        <Route path="/add-course" element={<PrivateRoute><AddNewCourse onAddCourse={handleAddCourse} /></PrivateRoute>} />
        <Route path="/assessments" element={<PrivateRoute><Assessments /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/myclass" element={<PrivateRoute><MyClass /></PrivateRoute>} />
        <Route path="/view-marks/:courseId/:tutorialId" element={<PrivateRoute><ViewMarks /></PrivateRoute>} />
        <Route path="/course-menu/:courseId" element={<PrivateRoute><CourseMenu /></PrivateRoute>} />
        <Route path="/tutorials/:courseId" element={<PrivateRoute><Tutorials /></PrivateRoute>} />

        {/* ✅ Fix: Include `className` in the route path */}
        <Route path="/mark-entry/:courseId/:className/:tutorialId/:maxMarks" element={<PrivateRoute><MarkEntry /></PrivateRoute>} />

        <Route path="/reports/:courseId" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/consolidate/:courseId" element={<PrivateRoute><Consolidate /></PrivateRoute>} />
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
