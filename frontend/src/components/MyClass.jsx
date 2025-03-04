import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUpload } from "react-icons/fa"; // Upload icon
import "../css/MyClass.css";

const MyClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [newClass, setNewClass] = useState("");
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ rollNo: "", name: "", email: "" });
  const [showStudents, setShowStudents] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

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

  const fetchStudents = async (className) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students?className=${className}`);
      setStudents(res.data);
      setShowStudents(true);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const addClass = async () => {
    if (!newClass.trim()) {
      alert("Please enter a valid class name.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/classes", { name: newClass });
      setClasses([...classes, res.data]);
      setSelectedClass(res.data.name);
      setNewClass("");
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const addStudent = async () => {
    if (!newStudent.rollNo || !newStudent.name || !newStudent.email || !selectedClass) {
      alert("Please fill all fields and select a class!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/students", {
        ...newStudent,
        className: selectedClass,
      });

      setStudents([...students, res.data]);
      setNewStudent({ rollNo: "", name: "", email: "" });
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  // 📂 File Upload Handler for Auto Student Entry
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("className", selectedClass); // Ensure correct class name

    try {
      const res = await axios.post("http://localhost:5000/api/upload-students", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.students) {
        console.log("📌 Extracted Students:", res.data.students);
        setStudents((prevStudents) => [...prevStudents, ...res.data.students]);
        alert("Students added successfully from PDF and saved to the database!");
      } else {
        alert("Failed to extract students from the file.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file.");
    }
  };

  return (
    <div className="myclass-container">
      <h2>Manage Classes</h2>

      <div className="class-input">
        <input
          type="text"
          placeholder="Enter new class name (e.g., G1)"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />
        <button onClick={addClass}>Add Class</button>
      </div>

      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>
            {cls.name}
          </option>
        ))}
      </select>

      <button onClick={() => fetchStudents(selectedClass)}>View Students</button>

      <h3>Add Student</h3>
      <input
        type="text"
        placeholder="Roll No"
        value={newStudent.rollNo}
        onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
      />
      <input
        type="text"
        placeholder="Name"
        value={newStudent.name}
        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={newStudent.email}
        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
      />
      <button onClick={addStudent}>Add Student</button>

      {/* 📂 Upload Button */}
      <label className="upload-label">
        <input type="file" accept=".pdf" onChange={handleFileUpload} hidden />
        <span className="upload-button">
          <FaUpload /> Upload PDF to Auto-Enter Students
        </span>
      </label>

      {showStudents && (
        <div>
          <h3>Students in {selectedClass} ({students.length} students)</h3>
          {students.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <table className="students-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.rollNo}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default MyClass;
