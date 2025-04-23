import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


const Performance = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("marks");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchSavedMarks(courseId);
  }, [courseId, selectedClass]);

  // ✅ Fetch Courses and Classes
  const fetchCourses = async () => {
    try {
      const [coursesRes, classesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/course"),
        axios.get("http://localhost:5000/api/classes"),
      ]);

      console.log("Courses Response:", JSON.stringify(coursesRes.data.slice(0, 3), null, 2));
      console.log("Classes Response:", JSON.stringify(classesRes.data, null, 2));

      if (coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
        setCourseId(coursesRes.data[0]._id);
      } else {
        setError("No courses found.");
      }

      setAvailableClasses(classesRes.data.map((cls) => cls.name.toLowerCase()));
    } catch (error) {
      console.error("❌ Error fetching courses or classes:", error);
      setError("Failed to load courses or classes.");
    }
  };

  // ✅ Fetch Saved Total Marks
  const fetchSavedMarks = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`http://localhost:5000/api/overall-marks/${selectedCourseId}`);
      console.log("Overall Marks Response:", JSON.stringify(res.data.slice(0, 3), null, 2));

      if (!res.data || res.data.length === 0) {
        setError("No student marks found for this course.");
        setStudents([]);
        return;
      }

      // ✅ Filter by className
      const selected = selectedClass.trim().toLowerCase();
      const filteredStudents = selected === "all"
        ? res.data
        : res.data.filter((student) => {
            const studentClass = student.className?.trim().toLowerCase() || "unknown";
            console.log(`Comparing [${student.rollNo}]: ${studentClass} === ${selected}`);
            return studentClass === selected;
          });

      if (filteredStudents.length === 0) {
        setError(`No students found for class: ${selectedClass.toUpperCase()}. Ensure class names are correctly set in the database.`);
        setStudents([]);
        return;
      }

      // ✅ Extract relevant data
      const studentData = filteredStudents.map((student) => ({
        studentName: student.studentName || "N/A",
        rollNo: student.rollNo,
        className: student.className || "unknown",
        total: parseFloat(student.total) || 0,
      }));

      console.log("Filtered Students Data:", JSON.stringify(studentData.slice(0, 3), null, 2));
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
    .filter((student) => (filterValue !== "" ? student.total < parseFloat(filterValue) : true));

  // ✅ Class Performance Analysis (Based on 50 Marks)
  const gradeDistribution = () => {
    const categories = { "A (40-50)": 0, "B (30-39)": 0, "C (20-29)": 0, "D (Below 20)": 0 };

    students.forEach((student) => {
      if (student.total >= 40) categories["A (40-50)"]++;
      else if (student.total >= 30) categories["B (30-39)"]++;
      else if (student.total >= 20) categories["C (20-29)"]++;
      else categories["D (Below 20)"]++;
    });

    return Object.keys(categories).map((key) => ({ name: key, value: categories[key] }));
  };

  // ✅ Line Chart Data for Average Marks Trend
  const lineChartData = gradeDistribution().map((category) => ({
    name: category.name,
    average: category.value > 0 ? students.filter((s) => {
      if (category.name === "A (40-50)") return s.total >= 40;
      if (category.name === "B (30-39)") return s.total >= 30 && s.total < 40;
      if (category.name === "C (20-29)") return s.total >= 20 && s.total < 30;
      return s.total < 20;
    }).reduce((sum, s) => sum + s.total, 0) / category.value : 0,
  }));

  // ✅ Class Statistics
  const classStatistics = () => {
    const marks = students.map((s) => s.total).filter((m) => !isNaN(m));
    const average = marks.length ? (marks.reduce((sum, m) => sum + m, 0) / marks.length).toFixed(2) : 0;
    const median = marks.length ? quantile(marks.sort((a, b) => a - b), 0.5).toFixed(2) : 0;
    const stdDev = marks.length
      ? Math.sqrt(marks.reduce((sum, m) => sum + Math.pow(m - average, 2), 0) / marks.length).toFixed(2)
      : 0;

    return { average, median, stdDev };
  };

  // ✅ Quantile Helper Function
  const quantile = (arr, q) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    }
    return arr[base];
  };

  // ✅ Top Performers
  const topPerformers = [...students]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // ✅ Export Data as CSV
  const exportCSV = () => {
    const csvRows = [
      ["Student Name", "Roll Number", "Class", "Total Marks"],
      ...sortedStudents.map((student) => [student.studentName, student.rollNo, student.className, student.total]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Student_Performance_${courseId}_${selectedClass}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Export Data as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`📊 Student Performance Report (${selectedClass.toUpperCase()})`, 14, 10);
    autoTable(doc, {
      head: [["Student Name", "Roll Number", "Class", "Total Marks"]],
      body: sortedStudents.map((student) => [student.studentName, student.rollNo, student.className, student.total]),
    });

    // Add Class Statistics
    const stats = classStatistics();
    doc.text("Class Statistics:", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: [
        ["Average Marks", stats.average],
        ["Median Marks", stats.median],
        ["Standard Deviation", stats.stdDev],
      ],
      startY: doc.lastAutoTable.finalY + 20,
    });

    doc.save(`Student_Performance_${courseId}_${selectedClass}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="performance-container">
      <h2>📊 Student Performance Analysis</h2>

      {/* ✅ Course Selection */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Select Course: </label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseName}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Class Selection */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Select Class: </label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="All">All</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Sorting & Filtering Options */}
      <div className="controls">
        <label>Sort By: </label>
        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="marks">Marks (Highest First)</option>
          <option value="name">Name (A-Z)</option>
        </select>

        <label>Show Students Below Marks: </label>
        <input
          type="number"
          placeholder="Enter marks"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />

        <button onClick={exportCSV} className="export-btn">📄 Export CSV</button>
        <button onClick={exportPDF} className="export-btn">📜 Export PDF</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : students.length > 0 ? (
        <>
          {/* ✅ Class Statistics */}
          <div className="statistics">
            <h3>Class Statistics ({selectedClass.toUpperCase()})</h3>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Average Marks</td>
                  <td>{classStatistics().average}</td>
                </tr>
                <tr>
                  <td>Median Marks</td>
                  <td>{classStatistics().median}</td>
                </tr>
                <tr>
                  <td>Standard Deviation</td>
                  <td>{classStatistics().stdDev}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ✅ Top Performers */}
          <div className="top-performers">
            <h3>Top 5 Performers</h3>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Total Marks</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((student) => (
                  <tr key={student.rollNo}>
                    <td>{student.studentName}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Interactive Bar Chart */}
          <h3>Student Marks Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedStudents} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="studentName" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 50]} />
              <Tooltip />
              <Bar dataKey="total" fill="#4CAF50" barSize={40} />
            </BarChart>
          </ResponsiveContainer>

          {/* ✅ Class Performance Pie Chart */}
          <h3>Grade Distribution</h3>
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

          {/* ✅ Line Chart for Average Marks Trend */}
          <h3>Average Marks Trend by Grade Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 50]} />
              <Tooltip />
              <Line type="monotone" dataKey="average" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>

          {/* ✅ Data Table */}
          <h3>All Students</h3>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Total Marks</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.studentName}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.className.toUpperCase()}</td>
                  <td>{student.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No data available for the selected course and class: {selectedClass.toUpperCase()}.</p>
      )}
    </div>
  );
};

export default Performance;