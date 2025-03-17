import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // Excel Parsing
import "../css/Tutorials.css";

const AssignmentMarks = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [assignment, setAssignment] = useState({ id: 1, name: "Assignment 1", pdf: null });
  const [showMarksEntry, setShowMarksEntry] = useState(false);
  const [showMarksTable, setShowMarksTable] = useState(false);
  const [maxMarks, setMaxMarks] = useState(null);
  const [isMaxMarksSet, setIsMaxMarksSet] = useState(false);
  const [isMarksSaved, setIsMarksSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/course/${courseId}`);
      setCourse(res.data);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/classes");
      setClasses(res.data);
      if (res.data.length > 0) {
        setSelectedClass(res.data[0].name);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students?className=${selectedClass}`);
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchSavedMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/assignment-marks/${courseId}/${assignment.id}`);
      if (res.data && Array.isArray(res.data)) {
        const savedMarks = {};
        res.data.forEach((entry) => {
          savedMarks[entry.rollNo] = entry.marks;
        });
        setMarks(savedMarks);
        setIsMarksSaved(true);
      }
    } catch (error) {
      console.error("Error fetching saved marks:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return alert("No file selected");

    const formData = new FormData();
    formData.append("file", file);

    console.log("📤 Sending file:", file.name);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-marks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.marks) {
        console.log("📊 Extracted Marks from File:", res.data.marks);

        const updatedMarks = {};
        students.forEach((student) => {
          const normalizedRollNo = student.rollNo.toLowerCase();
          if (res.data.marks[normalizedRollNo] !== undefined) {
            updatedMarks[student.rollNo] = res.data.marks[normalizedRollNo];
          }
        });

        setMarks(updatedMarks);
        console.log("📌 Updated Marks (Mapped to Students):", updatedMarks);
        alert("Marks loaded successfully!");
      } else {
        alert("Failed to extract marks from the file.");
      }
    } catch (error) {
      console.error("❌ Error processing file:", error.response?.data || error.message);
      alert("Error processing file.");
    }
  };

  const handleEnterMarks = () => {
    if (!isMaxMarksSet) {
      alert("Please set the max marks before entering marks.");
      return;
    }
    setShowMarksEntry(true);
    fetchStudents();
    fetchSavedMarks();
  };

  const handleViewMarks = () => {
    if (!isMarksSaved) {
      alert("No marks available! Please enter and save marks first.");
      return;
    }
    setShowMarksTable((prev) => !prev); // Toggle view marks table
    fetchSavedMarks();
  };

  const handleMarkChange = (rollNo, value) => {
    const enteredMark = Number(value);
    if (enteredMark > maxMarks) {
      alert(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    setMarks((prevMarks) => ({ ...prevMarks, [rollNo]: enteredMark }));
  };

  const saveMarks = async () => {
    if (!courseId || !selectedClass || !assignment.id || !students.length) {
      alert("Missing required data!");
      return;
    }

    const requestData = students.map((student) => ({
      courseId,
      className: selectedClass,
      rollNo: student.rollNo,
      assignmentId: assignment.id,
      marks: marks[student.rollNo] || 0,
      maxMarks,
    }));

    console.log("📤 Saving Marks:", requestData);

    try {
      await axios.post("http://localhost:5000/api/assignment-marks", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      setIsMarksSaved(true);
      alert("Marks saved successfully!");
    } catch (error) {
      console.error("❌ Error saving marks:", error.response?.data || error.message);
      alert("Error saving marks. Check console.");
    }
  };

  return (
    <div className="assignment-marks-container">
      <h2>Manage Assignment Marks for {course?.courseName || "Loading..."}</h2>

      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>{cls.name}</option>
        ))}
      </select>

      <div className="max-marks-section">
        <label>Set Max Marks:</label>
        <input
          type="number"
          value={maxMarks || ""}
          onChange={(e) => setMaxMarks(Number(e.target.value))}
          min="1"
          max="100"
        />
        <button onClick={() => setIsMaxMarksSet(true)}>Set Max Marks</button>
      </div>

      <table className="assignment-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Upload PDF</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{assignment.name}</td>
            <td>
              <input type="file" accept=".pdf, .xlsx, .xls" onChange={handleFileUpload} />
            </td>
            <td>
              <button onClick={handleEnterMarks}>{isMarksSaved ? "Edit Marks" : "Enter Marks"}</button>
              <button onClick={handleViewMarks}>View Marks</button>
            </td>
          </tr>
        </tbody>
      </table>

      {showMarksEntry && (
        <div className="mark-entry-section">
          <h3>Enter Marks (Max: {maxMarks})</h3>
          <button onClick={saveMarks}>Save Marks</button>
        </div>
      )}

      {showMarksTable && (
        <div className="view-marks-section">
          <h3>Saved Marks</h3>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>{marks[student.rollNo] ?? "Not Entered"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignmentMarks;
