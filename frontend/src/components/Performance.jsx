import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../css//performance.css"; // Import the separate CSS file

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

  // Fetch Courses and Classes
  const fetchCourses = async () => {
    try {
      const [coursesRes, classesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/course"),
        axios.get("http://localhost:5000/api/classes"),
      ]);

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

  // Fetch Saved Total Marks
  const fetchSavedMarks = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`http://localhost:5000/api/overall-marks/${selectedCourseId}`);

      if (!res.data || res.data.length === 0) {
        setError("No student marks found for this course.");
        setStudents([]);
        return;
      }

      // Filter by className
      const selected = selectedClass.trim().toLowerCase();
      const filteredStudents = selected === "all"
        ? res.data
        : res.data.filter((student) => {
            const studentClass = student.className?.trim().toLowerCase() || "unknown";
            return studentClass === selected;
          });

      if (filteredStudents.length === 0) {
        setError(`No students found for class: ${selectedClass.toUpperCase()}. Ensure class names are correctly set in the database.`);
        setStudents([]);
        return;
      }

      // Extract relevant data
      const studentData = filteredStudents.map((student) => ({
        studentName: student.studentName || "N/A",
        rollNo: student.rollNo,
        className: student.className || "unknown",
        total: parseFloat(student.total) || 0,
      }));

      setStudents(studentData);
    } catch (error) {
      console.error("❌ Error fetching student marks:", error);
      setError("Failed to fetch student marks.");
    } finally {
      setLoading(false);
    }
  };

  // Sorting Function
  const sortedStudents = [...students]
    .sort((a, b) => (sortType === "marks" ? b.total - a.total : a.studentName.localeCompare(b.studentName)))
    .filter((student) => (filterValue !== "" ? student.total < parseFloat(filterValue) : true));

  // Class Performance Analysis (Based on 50 Marks)
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

  // Line Chart Data for Average Marks Trend
  const lineChartData = gradeDistribution().map((category) => ({
    name: category.name,
    average: category.value > 0 ? students.filter((s) => {
      if (category.name === "A (40-50)") return s.total >= 40;
      if (category.name === "B (30-39)") return s.total >= 30 && s.total < 40;
      if (category.name === "C (20-29)") return s.total >= 20 && s.total < 30;
      return s.total < 20;
    }).reduce((sum, s) => sum + s.total, 0) / category.value : 0,
  }));

  // Class Statistics
  const classStatistics = () => {
    const marks = students.map((s) => s.total).filter((m) => !isNaN(m));
    const average = marks.length ? (marks.reduce((sum, m) => sum + m, 0) / marks.length).toFixed(2) : 0;
    const median = marks.length ? quantile(marks.sort((a, b) => a - b), 0.5).toFixed(2) : 0;
    const stdDev = marks.length
      ? Math.sqrt(marks.reduce((sum, m) => sum + Math.pow(m - average, 2), 0) / marks.length).toFixed(2)
      : 0;

    return { average, median, stdDev };
  };

  // Quantile Helper Function
  const quantile = (arr, q) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    }
    return arr[base];
  };

  // Top Performers
  const topPerformers = [...students]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const COLORS = ["#8A2BE2", "#9370DB", "#BA55D3", "#D8BFD8"];

  // Export Data as CSV
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

  // Export Data as PDF
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
      {/* Header */}
      <div className="header-container fade-in">
        <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10"></path>
    <path d="M18 20V4"></path>
    <path d="M6 20v-4"></path>
  </svg>
  Student Performance Analysis
</h1>

        <p className="page-subtitle">Track and analyze student performance across courses and classes</p>
      </div>

      {/* Controls Card */}
      <div className="card slide-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Selection */}
          <div className="form-group">
            <label className="form-label">Select Course</label>
            <div className="select-wrapper">
              <select 
                className="form-select"
                value={courseId} 
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Selection */}
          <div className="form-group">
            <label className="form-label">Select Class</label>
            <div className="select-wrapper">
              <select 
                className="form-select"
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="All">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtering */}
          <div className="form-group">
            <label className="form-label">Show Students Below Marks</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter marks threshold"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-4">
          <div className="form-group" style={{ minWidth: '200px' }}>
            <label className="form-label">Sort By</label>
            <div className="select-wrapper">
              <select 
                className="form-select"
                value={sortType} 
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="marks">Marks (Highest First)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0">
            <button onClick={exportCSV} className="btn btn-secondary scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </button>
            <button onClick={exportPDF} className="btn btn-primary scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-message slide-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      ) : students.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Class Statistics */}
            <div className="card fade-in">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Class Statistics ({selectedClass.toUpperCase()})
              </h3>
              <table className="data-table">
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

            {/* Top Performers */}
            <div className="card fade-in">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Top 5 Performers
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Class</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((student, index) => (
                    <tr key={index} className={index === 0 ? "top-performer" : ""}>
                      <td>{student.studentName}</td>
                      <td>{student.rollNo}</td>
                      <td>{student.className}</td>
                      <td>{student.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Grade Distribution Chart */}
            <div className="card fade-in">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"></path>
                </svg>
                Grade Distribution
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {gradeDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Marks Chart */}
            <div className="card fade-in">
              <h3 className="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Average Marks by Grade Category
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#8A2BE2"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Students Data Table */}
          <div className="card fade-in">
            <h3 className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                <path d="M16 3.13a4 4 0 010 7.75"></path>
              </svg>
              Student Results
              <span className="student-count">({sortedStudents.length} students)</span>
            </h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Class</th>
                    <th>Total Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => (
                    <tr key={index}>
                      <td>{student.studentName}</td>
                      <td>{student.rollNo}</td>
                      <td>{student.className}</td>
                      <td>{student.total}</td>
                      <td>
                        <span className={`grade grade-${
                          student.total >= 40 ? "a" :
                          student.total >= 30 ? "b" :
                          student.total >= 20 ? "c" : "d"
                        }`}>
                          {student.total >= 40 ? "A" :
                           student.total >= 30 ? "B" :
                           student.total >= 20 ? "C" : "D"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marks Distribution Bar Chart */}
          <div className="card fade-in mt-6">
            <h3 className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="10" width="4" height="10"></rect>
                <rect x="10" y="4" width="4" height="16"></rect>
                <rect x="18" y="8" width="4" height="12"></rect>
              </svg>
              Marks Distribution
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8A2BE2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state slide-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12h8"></path>
          </svg>
          <p>No student data found. Please select a course and class to view performance analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Performance;