import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/Performance.css"; // Custom CSS for styling

const Performance = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("marks"); // Default sorting by marks
  const [filterValue, setFilterValue] = useState(""); // Input filter for marks

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchSavedMarks(courseId);
  }, [courseId]);

  // ✅ Fetch Courses
  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/course");
      if (res.data.length > 0) {
        setCourses(res.data);
        setCourseId(res.data[0]._id);
      } else {
        setError("No courses found.");
      }
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      setError("Failed to load courses.");
    }
  };

  // ✅ Fetch Saved Total Marks
  const fetchSavedMarks = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`http://localhost:5000/api/overall-marks/${selectedCourseId}`);

      if (!res.data || res.data.length === 0) {
        setError("No student marks found.");
        setStudents([]);
        return;
      }

      // ✅ Extract only relevant data
      const studentData = res.data.map(student => ({
        studentName: student.studentName,
        rollNo: student.rollNo,
        total: parseFloat(student.total), // Ensure it's a number
      }));

      setStudents(studentData);
    } catch (error) {
      console.error("❌ Error fetching student marks:", error);
      setError("Failed to fetch student marks.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sorting Function
  const sortedStudents = [...students]
    .sort((a, b) => (sortType === "marks" ? b.total - a.total : a.studentName.localeCompare(b.studentName)))
    .filter(student => (filterValue !== "" ? student.total < parseFloat(filterValue) : true)); // ✅ Apply input filter

  // ✅ Class Performance Analysis (Based on 50 Marks)
  const gradeDistribution = () => {
    const categories = { "A (40-50)": 0, "B (30-39)": 0, "C (20-29)": 0, "D (Below 20)": 0 };

    students.forEach(student => {
      if (student.total >= 40) categories["A (40-50)"]++;
      else if (student.total >= 30) categories["B (30-39)"]++;
      else if (student.total >= 20) categories["C (20-29)"]++;
      else categories["D (Below 20)"]++;
    });

    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]; // Pie Chart Colors

  // ✅ Export Data as CSV
  const exportCSV = () => {
    const csvRows = [
      ["Student Name", "Roll Number", "Total Marks"],
      ...sortedStudents.map(student => [student.studentName, student.rollNo, student.total]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(row => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Student_Performance_${courseId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
  };

  // ✅ Export Data as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("📊 Student Performance Report", 14, 10);
    autoTable(doc, {
      head: [["Student Name", "Roll Number", "Total Marks"]],
      body: sortedStudents.map(student => [student.studentName, student.rollNo, student.total]),
    });
    doc.save(`Student_Performance_${courseId}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="performance-container">
      <h2>📊 Student Performance Analysis</h2>

      {/* ✅ Course Selection */}
      <label>Select Course:</label>
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.courseName}
          </option>
        ))}
      </select>

      {/* ✅ Sorting & Filtering Options */}
      <div className="controls">
        <label>Sort By:</label>
        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="marks">Marks (Highest First)</option>
          <option value="name">Name (A-Z)</option>
        </select>

        {/* 🔎 Filter by Marks Below */}
        <label>Show Students Below Marks:</label>
        <input
          type="number"
          placeholder="Enter marks"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />

        {/* ✅ Export Buttons */}
        <button onClick={exportCSV} className="export-btn">📄 Export CSV</button>
        <button onClick={exportPDF} className="export-btn">📜 Export PDF</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : students.length > 0 ? (
        <>
          {/* ✅ Interactive Bar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedStudents} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="studentName" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 50]} />
              <Tooltip />
              <Bar dataKey="total" fill="#4CAF50" barSize={40} />
            </BarChart>
          </ResponsiveContainer>

          {/* 🏆 Class Performance Pie Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={gradeDistribution()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {gradeDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* ✅ Data Table */}
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Total Marks</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.studentName}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default Performance;
