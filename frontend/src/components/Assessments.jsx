import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Assessments.css"; // Import the CSS file

const Assessments = () => {
  const [assignments, setAssignments] = useState(0);
  const [pdfUpload, setPdfUpload] = useState(false);
  const [tutorials, setTutorials] = useState(0);
  const [assessmentsList, setAssessmentsList] = useState([]);

  useEffect(() => {
    // Fetch existing assessments when the component mounts
    const fetchAssessments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/assessment");
        setAssessmentsList(response.data);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      }
    };
    fetchAssessments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sample courseId; you can replace this with the courseId input
    const courseId = "62cfe31c8d6b2b3d1e632d69"; // Replace with dynamic course ID

    const newAssessment = {
      numAssignments: assignments,
      pdfUpload,
      numTutorials: tutorials,
      courseId,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/assessment", newAssessment);
      console.log(response.data);
      // After successful submission, fetch the updated assessments list
      setAssessmentsList((prevList) => [...prevList, response.data.assessment]);
    } catch (error) {
      console.error("Error adding assessment:", error);
    }
  };

  return (
    <div className="assessments-container">
      <h2 className="assessments-title">Assessment Details</h2>

      <form onSubmit={handleSubmit} className="assessments-form">
        <div className="form-group">
          <label className="form-label">No. of Assignments:</label>
          <input
            type="number"
            value={assignments}
            onChange={(e) => setAssignments(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">PDF Upload:</label>
          <select
            onChange={(e) => setPdfUpload(e.target.value === "yes")}
            className="form-input"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">No. of Tutorials:</label>
          <input
            type="number"
            value={tutorials}
            onChange={(e) => setTutorials(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>

      <div className="existing-assessments">
        <h3 className="existing-assessments-title">Existing Assessments</h3>
        <ul className="assessments-list">
          {assessmentsList.map((assessment) => (
            <li key={assessment._id} className="assessment-item">
              <p><strong>Assignments:</strong> {assessment.numAssignments}</p>
              <p><strong>PDF Upload:</strong> {assessment.pdfUpload ? "Yes" : "No"}</p>
              <p><strong>Tutorials:</strong> {assessment.numTutorials}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Assessments;