import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Assessments = () => {
  const { courseId: paramCourseId } = useParams();
  const [courseId, setCourseId] = useState(paramCourseId || "");
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [showMarksEntry, setShowMarksEntry] = useState(null);
  const [showMarksTable, setShowMarksTable] = useState(null);
  const [isMarksSaved, setIsMarksSaved] = useState({ CA1: false, CA2: false });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchClasses();
  }, [courseId]);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass]);

  // ✅ Fetch Courses
  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/course");
      setCourses(res.data);
      if (res.data.length > 0) setCourseId(res.data[0]._id);
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      alert("Failed to load courses. Check the server.");
    }
  };

  // ✅ Fetch Classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/classes?courseId=${courseId}`);
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0].name);
    } catch (error) {
      console.error("❌ Error fetching classes:", error);
    }
  };

  // ✅ Fetch Students
  const fetchStudents = async () => {
    if (!selectedClass) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/students?className=${selectedClass}`);
      setStudents(res.data);
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      alert("Failed to fetch students.");
    }
  };

  // ✅ Fetch Saved Marks
  const fetchSavedMarks = async (assessmentId) => {
    try {
      const res = await axios.get("http://localhost:5000/api/assessment/marks", {
        params: { courseId, assessmentId },
      });

      if (res.data && Array.isArray(res.data)) {
        const savedMarks = {};
        res.data.forEach((entry) => {
          if (!savedMarks[entry.rollNo]) savedMarks[entry.rollNo] = {};
          savedMarks[entry.rollNo][assessmentId] = entry.marks;
        });

        setMarks(savedMarks);
        setIsMarksSaved((prev) => ({ ...prev, [assessmentId]: true }));
        setShowMarksTable(assessmentId);
      }
    } catch (error) {
      console.error("❌ Error fetching saved marks:", error);
      alert("Error fetching marks. Please try again.");
    }
  };

  // ✅ Handle Manual Mark Entry
  const handleMarkChange = (rollNo, assessmentId, value) => {
    const enteredMark = Number(value);
    if (enteredMark > 50) {
      alert("Marks cannot exceed 50");
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

  // ✅ Save Marks (Manual & Auto-Loaded)
  const saveMarks = async (assessmentId) => {
    if (!courseId || !selectedClass || !students.length) {
      alert("Missing required data!");
      return;
    }

    const requestData = students.map((student) => ({
      courseId,
      className: selectedClass,
      rollNo: student.rollNo,
      studentName: student.name,
      assessmentId,
      marks: marks[student.rollNo]?.[assessmentId] || 0,
    }));

    try {
      await axios.post("http://localhost:5000/api/assessment/marks", requestData);
      setIsMarksSaved((prev) => ({ ...prev, [assessmentId]: true }));
      alert(`Marks for ${assessmentId} saved successfully!`);
    } catch (error) {
      console.error("❌ Error saving marks:", error);
      alert(`Error saving marks: ${error.response?.data?.error || error.message}`);
    }
  };

  // ✅ Auto Mark Entry - File Upload
  const handleFileUpload = async (event, assessmentId) => {
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
            if (!updatedMarks[student.rollNo]) updatedMarks[student.rollNo] = {};
            updatedMarks[student.rollNo][assessmentId] = res.data.marks[normalizedRollNo];
          }
        });

        setMarks(updatedMarks);
        alert("Marks loaded successfully!");
      } else {
        alert("Failed to extract marks from the file.");
      }
    } catch (error) {
      console.error("❌ Error processing file:", error.response?.data || error.message);
      alert("Error processing file.");
    }
  };

  return (
    <div className="assessment-marks-container">
      <h2>Continuous Assessments (CA) Marks</h2>

      {/* ✅ Select Course Dropdown */}
      <label>Select Course:</label>
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.courseName}
          </option>
        ))}
      </select>

      {/* ✅ Select Class Dropdown */}
      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>
            {cls.name}
          </option>
        ))}
      </select>

      {/* ✅ Assessment Table */}
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
                <button onClick={() => setShowMarksEntry(assessment)}>
                  {isMarksSaved[assessment] ? "Edit Marks" : "Enter Marks"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Enter Marks Section */}
      {showMarksEntry && (
        <div>
          <h3>Enter Marks for {showMarksEntry}</h3>
          <input type="file" accept=".pdf, .xlsx, .xls" onChange={(e) => handleFileUpload(e, showMarksEntry)} />
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Marks (Out of 50)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>
                    <input type="number" value={marks[student.rollNo]?.[showMarksEntry] || ""} 
                      onChange={(e) => handleMarkChange(student.rollNo, showMarksEntry, e.target.value)} 
                      min="0" max="50" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => saveMarks(showMarksEntry)}>Save {showMarksEntry} Marks</button>
        </div>
      )}
    </div>
  );
};

export default Assessments;
