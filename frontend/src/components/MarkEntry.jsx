import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // Excel Parsing
import "../css/MarkEntry.css";

const MarkEntry = () => {
  const { courseId, className, tutorialId, maxMarks } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchSavedMarks();
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

  // Fetch Saved Marks
  const fetchSavedMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}/${tutorialId}`);
      if (res.data && Array.isArray(res.data)) {
        const savedMarks = {};
        res.data.forEach((entry) => {
          savedMarks[entry.rollNo] = entry.marks;
        });
        setMarks(savedMarks);
      }
    } catch (error) {
      console.error("Error fetching saved marks:", error);
    }
  };

  // Handle Mark Entry
  const handleMarkChange = (rollNo, value) => {
    const enteredMark = Number(value);
    if (enteredMark > Number(maxMarks)) {
      alert(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    setMarks((prevMarks) => ({ ...prevMarks, [rollNo]: enteredMark }));
  };

  // 📂 File Upload Handler (Excel & PDF)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-marks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.marks) {
        console.log("📊 Extracted Marks from File:", res.data.marks);

        // Ensure extracted marks are properly mapped to student roll numbers
        const updatedMarks = {};
        students.forEach((student) => {
          if (res.data.marks[student.rollNo] !== undefined) {
            updatedMarks[student.rollNo] = res.data.marks[student.rollNo];
          }
        });

        setMarks(updatedMarks); // ✅ Marks now update UI correctly
        console.log("📌 Updated Marks:", updatedMarks);

        alert("Marks loaded successfully!");
      } else {
        alert("Failed to extract marks from the file.");
      }
    } catch (error) {
      console.error("❌ Error processing file:", error);
      alert("Error processing file.");
    }
  };

  // Save Marks
  const saveMarks = async () => {
    const requestData = students.map((student) => ({
      courseId,
      className,
      rollNo: student.rollNo,
      tutorialId,
      marks: marks[student.rollNo] || 0, // ✅ Ensure marks are correctly saved
      maxMarks,
    }));

    console.log("📥 Saving Marks:", requestData); // Debugging log

    try {
      await axios.post("http://localhost:5000/api/tutorial-marks", requestData);
      await axios.post("http://localhost:5000/api/tutorial-marks/complete-tutorial", { courseId, tutorialId });

      alert("Marks saved successfully!");
      navigate(`/tutorials/${courseId}`);
    } catch (error) {
      console.error("❌ Error saving marks:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="mark-entry-container">
      <h2>Mark Entry - Tutorial {tutorialId}</h2>
      <h4>Class: {className}</h4>
      <h4>Max Marks: {maxMarks}</h4>
      

      <div className="upload-container">
  <label className="upload-label">📂 Upload PDF for Auto Mark Entry</label>
  <label className="upload-button">
    Choose File
    <input type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileUpload} />
  </label>
</div>


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
                  value={marks[student.rollNo] ?? ""} // ✅ Marks will now show correctly
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
