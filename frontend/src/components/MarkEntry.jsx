import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/MarkEntry.css";

const MarkEntry = () => {
  const { courseId, className, tutorialId, maxMarks } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchSavedMarks(); // Fetch saved marks for editing
  }, [courseId, className, tutorialId]);

  // Fetch Students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students?className=${className}`);
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Fetch Saved Marks for the tutorial
// Fetch Saved Marks for the tutorial
const fetchSavedMarks = async () => {
  try {
    // Use correct URL with courseId and tutorialId
    const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}/${tutorialId}`);
    
    // Check if response data exists
    if (res.data && Array.isArray(res.data)) {
      const savedMarks = {};
      res.data.forEach((entry) => {
        savedMarks[entry.rollNo] = entry.marks;  // Save marks by rollNo
      });
      setMarks(savedMarks); // Update the state with the saved marks
    } else {
      console.error("No saved marks found or invalid response");
    }
  } catch (error) {
    console.error("Error fetching saved marks:", error);
  }
};


  // Handle Mark Entry Change (user editing the marks)
  const handleMarkChange = (rollNo, value) => {
    const enteredMark = Number(value);
    if (enteredMark > Number(maxMarks)) {
      alert(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    setMarks({ ...marks, [rollNo]: enteredMark });
  };

  // Save Marks and Complete Tutorial
  const saveMarks = async () => {
    if (!courseId || !tutorialId) {
      console.error("Error: courseId or tutorialId is missing!");
      return;
    }

    const requestData = students.map((student) => ({
      courseId,
      className,
      rollNo: student.rollNo,
      tutorialId,
      marks: marks[student.rollNo] || 0,
      maxMarks,
    }));

    console.log("Sending request data:", requestData); // Debugging log

    try {
      await axios.post("http://localhost:5000/api/tutorial-marks", requestData);

      await axios.post("http://localhost:5000/api/tutorial-marks/complete-tutorial", {
        courseId,
        tutorialId,
      });

      alert("Marks saved successfully!");
      navigate(`/tutorials/${courseId}`);
    } catch (error) {
      console.error("Error saving marks:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="mark-entry-container">
      <h2>Mark Entry - Tutorial {tutorialId}</h2>
      <p>Class: {className}</p>
      <p>Max Marks: {maxMarks}</p>

      <table className="marks-table">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Marks</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.rollNo}>
              <td>{student.rollNo}</td>
              <td>{student.name}</td>
              <td>
                <input
                  type="number"
                  value={marks[student.rollNo] || ""} // Pre-populate with saved marks
                  onChange={(e) => handleMarkChange(student.rollNo, e.target.value)}
                  min="0"
                  max={maxMarks}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={saveMarks}>Save Marks</button>
    </div>
  );
};

export default MarkEntry;
