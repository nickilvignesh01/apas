import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Assessments = () => {
  const { courseId: paramCourseId } = useParams();
  const [courseId, setCourseId] = useState(paramCourseId || "");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [showMarksEntry, setShowMarksEntry] = useState(null);
  const [isMarksSaved, setIsMarksSaved] = useState({ CA1: false, CA2: false });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

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
      console.log(`Fetching students for class: ${selectedClass}`);
      const res = await axios.get(`http://localhost:5000/api/students?className=${selectedClass}`);
      setStudents(res.data);
      console.log("Students fetched:", res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchSavedMarks = async (assessmentId) => {
    try {
      console.log(`Fetching saved marks for ${assessmentId}`);
      const res = await axios.get(`http://localhost:5000/api/assessment-marks/${courseId}?assessmentId=${assessmentId}`);
      if (res.data && Array.isArray(res.data)) {
        const savedMarks = {};
        res.data.forEach((entry) => {
          if (!savedMarks[entry.rollNo]) savedMarks[entry.rollNo] = {};
          savedMarks[entry.rollNo][assessmentId] = entry.marks;
        });
        setMarks((prevMarks) => ({ ...prevMarks, ...savedMarks }));
        setIsMarksSaved((prev) => ({ ...prev, [assessmentId]: true }));
      }
    } catch (error) {
      console.error("Error fetching saved marks:", error);
    }
  };

  const handleAutoMarkEntry = async (event, assessmentId) => {
    const file = event.target.files[0];
    if (!file) return alert("No file selected");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-marks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.marks) {
        const updatedMarks = { ...marks };
        students.forEach((student) => {
          const normalizedRollNo = student.rollNo.toLowerCase();
          if (res.data.marks[normalizedRollNo] !== undefined) {
            updatedMarks[student.rollNo] = {
              ...updatedMarks[student.rollNo],
              [assessmentId]: res.data.marks[normalizedRollNo],
            };
          }
        });

        setMarks(updatedMarks);
        alert(`Marks loaded successfully for ${assessmentId}!`);
      } else {
        alert("Failed to extract marks from the file.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file.");
    }
  };

  const handleMarkChange = (rollNo, assessmentId, value) => {
    const enteredMark = Number(value);
    if (enteredMark > 50) {
      alert(`Marks cannot exceed 50`);
      return;
    }
    setMarks((prevMarks) => ({
      ...prevMarks,
      [rollNo]: {
        ...prevMarks[rollNo],
        [assessmentId]: enteredMark,
      },
    }));
  };

  const saveMarks = async (assessmentId) => {
    if (!courseId || !selectedClass || !students.length) {
      alert("Missing required data!");
      return;
    }

    const requestData = students.map((student) => ({
      courseId,
      className: selectedClass,
      rollNo: student.rollNo,
      assessmentId,
      marks: marks[student.rollNo]?.[assessmentId] || 0,
    }));

    try {
      await axios.post("http://localhost:5000/api/assessment-marks", requestData);
      setIsMarksSaved((prev) => ({ ...prev, [assessmentId]: true }));
      alert(`Marks for ${assessmentId} saved successfully!`);
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Error saving marks.");
    }
  };

  return (
    <div className="assessment-marks-container">
      <h2>Continuous Assessments (CA) Marks</h2>

      <label>Enter Course ID:</label>
      <input type="text" value={courseId} onChange={(e) => setCourseId(e.target.value)} />

      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>{cls.name}</option>
        ))}
      </select>

      <table className="assessment-table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {["CA1", "CA2"].map((assessment) => (
            <tr key={assessment}>
              <td>{assessment}</td>
              <td>
                <button onClick={() => fetchSavedMarks(assessment)}>View Marks</button>
                <button onClick={() => setShowMarksEntry(assessment)}>Enter Marks</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showMarksEntry && (
        <div className="mark-entry-section">
          <h3>Enter Marks for {showMarksEntry} (Out of 50)</h3>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>{showMarksEntry} (Out of 50)</th>
                <th>Converted Marks (Out of 10)</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.rollNo}>
                    <td>{student.rollNo}</td>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        value={marks[student.rollNo]?.[showMarksEntry] || ""}
                        onChange={(e) => handleMarkChange(student.rollNo, showMarksEntry, e.target.value)}
                        min="0"
                        max="50"
                      />
                    </td>
                    <td>{(marks[student.rollNo]?.[showMarksEntry] || 0) / 5}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No students found. Please check the selected class.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div>
            <button onClick={() => saveMarks(showMarksEntry)}>Save {showMarksEntry} Marks</button>
            <label className="auto-mark-entry">
              Auto Mark Entry from File:
              <input type="file" accept=".pdf, .xlsx, .xls" onChange={(e) => handleAutoMarkEntry(e, showMarksEntry)} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;
