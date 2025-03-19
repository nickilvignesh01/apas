import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../css/Tutorials.css";

const AssignmentMarks = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [assignment, setAssignment] = useState({ id: 1, name: "Assignment 1", pdf: null });
  const [maxMarks, setMaxMarks] = useState(null);
  const [isMaxMarksSet, setIsMaxMarksSet] = useState(false);
  const [isMarksSaved, setIsMarksSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      if (!selectedClass) return;
      const res = await axios.get(`http://localhost:5000/api/students?className=${selectedClass}`);
      setStudents(res.data);

      // Reset marks when fetching students
      const initialMarks = {};
      res.data.forEach((student) => {
        initialMarks[student.rollNo] = "";
      });
      setMarks(initialMarks);
      setIsEditing(true);
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
        setIsEditing(false);
      } else {
        setMarks({});
      }
    } catch (error) {
      console.error("Error fetching saved marks:", error);
      setMarks({});
    }
  };

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
        const updatedMarks = {};
        students.forEach((student) => {
          if (res.data.marks[student.rollNo] !== undefined) {
            updatedMarks[student.rollNo] = res.data.marks[student.rollNo];
          }
        });
        setMarks(updatedMarks);
        alert("Marks loaded successfully!");
      } else {
        alert("Failed to extract marks from the file.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file.");
    }
  };

  const saveMarks = async () => {
    if (!isMaxMarksSet || maxMarks === null) {
      alert("Please set Max Marks before saving!");
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

    try {
      await axios.post("http://localhost:5000/api/assignment-marks", requestData);
      setIsMarksSaved(true);
      setIsEditing(false);
      alert("Marks saved successfully!");
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Error saving marks.");
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

      <label>Set Max Marks:</label>
      <input
        type="number"
        value={maxMarks || ""}
        onChange={(e) => setMaxMarks(Number(e.target.value))}
        min="1"
      />
      <button onClick={() => setIsMaxMarksSet(true)}>Set Max Marks</button>

      <label>Upload Marks (PDF/Excel):</label>
      <input type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileUpload} />

      {!isMarksSaved ? (
        <button onClick={fetchStudents}>Enter Marks</button>
      ) : (
        <button onClick={() => setIsEditing(true)}>Edit Marks</button>
      )}

      <button onClick={fetchSavedMarks}>View Marks</button>

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
              <td>
                <input
                  type="number"
                  value={marks[student.rollNo] !== undefined ? marks[student.rollNo] : ""}
                  onChange={(e) => {
                    if (!isEditing) return; // Prevent editing if not in edit mode
                    let enteredMarks = Number(e.target.value);

                    if (!isMaxMarksSet || maxMarks === null) {
                      alert("Please set Max Marks first!");
                      return;
                    }

                    if (!isNaN(enteredMarks) && enteredMarks >= 0 && enteredMarks <= maxMarks) {
                      setMarks({ ...marks, [student.rollNo]: enteredMarks });
                    } else {
                      alert(`Please enter marks between 0 and ${maxMarks}`);
                    }
                  }}
                  min="0"
                  max={maxMarks || ""}
                  disabled={!isEditing} // Disable input if not in edit mode
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={saveMarks} disabled={!isEditing}>Save Marks</button>
    </div>
  );
};

export default AssignmentMarks;
