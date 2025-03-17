import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Assessments.css";

const Assessments = () => {
  const [assignments, setAssignments] = useState([]);
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentMark, setAssignmentMark] = useState("");
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [overallMark, setOverallMark] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/assignments");
        setAssignments(response.data);
        calculateOverallMark(response.data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, []);

  const calculateOverallMark = (assignments) => {
    if (assignments.length === 0) return;
    const marks = assignments.map((a) => a.mark);
    const avgMark = marks.reduce((acc, mark) => acc + mark, 0) / marks.length;
    const bestMark = Math.max(...marks);
    setOverallMark({ average: avgMark.toFixed(2), best: bestMark });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseId || !assignmentName || assignmentMark === "" || !file) {
      return alert("All fields are required");
    }

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("assignmentName", assignmentName);
    formData.append("mark", assignmentMark);
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/api/assignments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAssignments([...assignments, response.data.assignment]);
      calculateOverallMark([...assignments, response.data.assignment]);
    } catch (error) {
      console.error("Error adding assignment:", error);
    }
  };

  return (
    <div className="assessments-container">
      <h2 className="assessments-title">Assignments</h2>

      <form onSubmit={handleSubmit} className="assessments-form">
        <div className="form-group">
          <label className="form-label">Course ID:</label>
          <input
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assignment Name:</label>
          <input
            type="text"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assignment Mark:</label>
          <input
            type="number"
            value={assignmentMark}
            onChange={(e) => setAssignmentMark(Number(e.target.value))}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Upload PDF:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="form-input"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Submit Assignment
        </button>
      </form>

      <div className="existing-assignments">
        <h3 className="existing-assignments-title">Submitted Assignments</h3>
        <ul className="assignments-list">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <li key={assignment._id} className="assignment-item">
                <p><strong>Assignment Name:</strong> {assignment.assignmentName}</p>
                <p><strong>Mark:</strong> {assignment.mark}</p>
                <p><a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">View PDF</a></p>
              </li>
            ))
          ) : (
            <p>No assignments found.</p>
          )}
        </ul>
      </div>

      {overallMark && (
        <div className="overall-mark">
          <h3>Overall Mark</h3>
          <p><strong>Average Mark:</strong> {overallMark.average}</p>
          <p><strong>Best Mark:</strong> {overallMark.best}</p>
        </div>
      )}
    </div>
  );
};

export default Assessments;
