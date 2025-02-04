import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/AddNewCourse.css";

const AddNewCourse = () => {
  const [courseName, setCourseName] = useState("");
  const [courseType, setCourseType] = useState("Lab");
  const [numOfStudents, setNumOfStudents] = useState("");
  const [syllabus, setSyllabus] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [duration, setDuration] = useState("");  // Define duration state
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSyllabus(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("courseName", courseName);
    formData.append("courseType", courseType);
    formData.append("numOfStudents", numOfStudents);
    formData.append("syllabus", syllabus);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("courseCode", courseCode);
    formData.append("duration", duration);  // Include duration in form data

    try {
      const response = await axios.post("http://localhost:5000/api/course", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
          <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Course Type:</label>
          <div className="radio-group">
            <label><input type="radio" name="courseType" value="Lab" checked={courseType === "Lab"} onChange={(e) => setCourseType(e.target.value)} /> Lab</label>
            <label><input type="radio" name="courseType" value="Theory" checked={courseType === "Theory"} onChange={(e) => setCourseType(e.target.value)} /> Theory</label>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Number of Students:</label>
          <input type="number" value={numOfStudents} onChange={(e) => setNumOfStudents(e.target.value)} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Syllabus (PDF):</label>
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Course Duration:</label>
          <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="form-input" placeholder="e.g., 3 months" required />
        </div>
        <div className="form-group">
          <label className="form-label">Course Duration (Start and End Date):</label>
          <div className="date-group">
            <label className="form-label">Start Date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" required />
            <label className="form-label">End Date:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Course Code:</label>
          <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="form-input" required />
        </div>
        <div className="button-group">
          <button type="submit" className="submit-button">Add Course</button>
        </div>
      </form>
    </div>
  );
};

export default AddNewCourse;
