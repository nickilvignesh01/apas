import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/AddNewCourse.css"; // Import the CSS file
const AddNewCourse = () => {
  const [courseName, setCourseName] = useState("");
  const [courseType, setCourseType] = useState("");
  const [numOfStudents, setNumOfStudents] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [duration, setDuration] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCourse = {
      courseName,
      courseType,
      numOfStudents,
      syllabus,
      duration,
      courseCode,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/course", newCourse);
      console.log(response.data);
      navigate("/courses");
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Failed to add course");
    }
  };

  return (
    <div className="add-course-container">
      <h2 className="add-course-title">Add New Course</h2>
      <form onSubmit={handleSubmit} className="add-course-form">
        <div className="form-group">
          <label className="form-label">Course Name:</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Course Type:</label>
          <input
            type="text"
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Number of Students:</label>
          <input
            type="number"
            value={numOfStudents}
            onChange={(e) => setNumOfStudents(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Syllabus:</label>
          <input
            type="text"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Duration:</label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Course Code:</label>
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button type="submit" className="submit-button">
          Add Course
        </button>
      </form>
    </div>
  );
};

export default AddNewCourse;