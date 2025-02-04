import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/MyClass.css";

const MyClass = () => {
  const [classes, setClasses] = useState([]); // Dynamic class list
  const [selectedClass, setSelectedClass] = useState("");
  const [newClass, setNewClass] = useState(""); // User-input class name
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ rollNo: "", name: "", email: "" });
  const [showStudents, setShowStudents] = useState(false); // Toggle student view

  // Fetch existing classes from backend
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/classes");
      setClasses(res.data);
      if (res.data.length > 0) {
        setSelectedClass(res.data[0].name); // Set first class as default
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch students when class changes
  const fetchStudents = async (className) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students?className=${className}`); // Use 'className' here
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };
  
  // Add a new class
  const addClass = async () => {
    if (!newClass.trim()) {
      alert("Please enter a valid class name.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/classes", { name: newClass });
      setClasses([...classes, res.data]); // Use response data (MongoDB document)
      setSelectedClass(res.data.name);
      setNewClass(""); // Clear input
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  // Add a new student
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
  

  return (
    <div className="myclass-container">
      <h2>Manage Classes</h2>

      {/* Add New Class */}
      <div className="class-input">
        <input
          type="text"
          placeholder="Enter new class name (e.g., G1)"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />
        <button onClick={addClass}>Add Class</button>
      </div>

      {/* Select Class */}
      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>
            {cls.name}
          </option>
        ))}
      </select>

      {/* View Students Button */}
      <button onClick={() => { fetchStudents(selectedClass); setShowStudents(true); }}>
        View Students
      </button>

      {/* Add New Student */}
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

      {/* List of Students (Visible only when 'View Students' is clicked) */}
      {showStudents && (
        <div>
          <h3>Students in {selectedClass}</h3>
          {students.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <ul>
              {students.map((student, index) => (
                <li key={index}>
                  {student.rollNo} - {student.name} ({student.email})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MyClass;
