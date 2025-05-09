import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import "../css/performance.css";

const IndividualReport = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tutorialMarks, setTutorialMarks] = useState([]);
  const [rollNoSearch, setRollNoSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);
  const caChartRef = useRef(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchStudents();
  }, [courseId, selectedClass]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setSelectedStudent(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesRes, classesRes] = await Promise.all([
        axios.get("${process.env.REACT_APP_API}/api/course"),
        axios.get("${process.env.REACT_APP_API}/api/classes"),
      ]);

      if (coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
        setCourseId(coursesRes.data[0]._id);
        setCourseName(coursesRes.data[0].courseName || "Unknown Course");
      } else {
        setError("No courses found.");
      }

      setAvailableClasses(classesRes.data.map((cls) => cls.name.toLowerCase()));
    } catch (error) {
      console.error("Error fetching courses or classes:", error);
      setError("Failed to load courses or classes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);
      setSelectedStudent(null);
      const [overallMarksRes, tutorialMarksRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/overall-marks/${courseId}`),
        axios.get(`${process.env.REACT_APP_API}/api/tutorial-marks/${courseId}`),
      ]);

      const selected = selectedClass.trim().toLowerCase();
      const filteredStudents = selected === "all"
        ? overallMarksRes.data
        : overallMarksRes.data.filter(
            (student) => student.className?.trim().toLowerCase() === selected
          );

      if (filteredStudents.length === 0) {
        setError(`No students found for class: ${selectedClass.toUpperCase()}`);
        setStudents([]);
        return;
      }

      setStudents(
        filteredStudents.map((student) => ({
          studentName: student.studentName || "N/A",
          rollNo: student.rollNo,
          className: student.className || "unknown",
          tutorial: parseFloat(student.tutorial) || 0,
          assignment: parseFloat(student.assignment) || 0,
          ca1: parseFloat(student.ca1) || 0,
          ca2: parseFloat(student.ca2) || 0,
          caTotal: parseFloat(student.caTotal) || 0,
          total: parseFloat(student.total) || 0,
        }))
      );

      setTutorialMarks(
        tutorialMarksRes.data.reduce((acc, mark) => {
          acc[mark.rollNo] = acc[mark.rollNo] || [];
          acc[mark.rollNo].push({
            tutorialId: mark.tutorialId,
            marks: mark.marks || 0,
            maxMarks: mark.maxMarks || 0,
          });
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch student data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const student = students.find(
      (s) => s.rollNo.toLowerCase() === rollNoSearch.trim().toLowerCase()
    );
    if (student) {
      setSelectedStudent(student);
      setRollNoSearch("");
    } else {
      setError("Student not found. Please check the roll number.");
      setSelectedStudent(null);
    }
  };

  const calculatePerformance = (student) => {
    const totalMaxMarks = 50;
    const percentage = (student.total / totalMaxMarks) * 100;
    let grade = percentage >= 80 ? "A" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : "D (Poor)";
    const isPoor = percentage < 50;
    let recommendation = isPoor
      ? "Focus on improving tutorial participation, assignment quality, and CA preparation. Attend extra classes if available."
      : percentage < 60
      ? "Review weak areas in tutorials and CA topics. Seek clarification from instructors."
      : "Keep up the good work!";

    return { percentage: percentage.toFixed(2), grade, isPoor, recommendation };
  };

  const getTutorialTrend = (rollNo) => {
    const tutorials = tutorialMarks[rollNo] || [];
    if (tutorials.length < 2) return "Insufficient data for trend analysis.";
    const percentages = tutorials.map((t) => (t.marks / t.maxMarks) * 100);
    const trend = percentages[percentages.length - 1] - percentages[0];
    return trend > 10
      ? "Improving performance across tutorials."
      : trend < -10
      ? "Declining performance; consider revising earlier topics."
      : "Stable performance across tutorials.";
  };

  const analyzeCAPerformance = (student) => {
    const ca1Percentage = (student.ca1 / 20) * 100;
    const ca2Percentage = (student.ca2 / 20) * 100;
    const caContribution = (student.caTotal / 50) * 100;
    const caDifference = ca2Percentage - ca1Percentage;
    const caTrend = caDifference > 10
      ? "Improved performance in CA2 compared to CA1."
      : caDifference < -10
      ? "Declined performance in CA2; review CA1 strengths."
      : "Stable performance between CA1 and CA2.";

    let caRecommendation = "";
    if (ca1Percentage < 50) caRecommendation += "Low CA1 score; review topics from first assessment. ";
    if (ca2Percentage < 50) caRecommendation += "Low CA2 score; focus on second assessment topics.";
    if (!caRecommendation) caRecommendation = "Maintain consistent CA performance.";

    return {
      ca1Percentage: ca1Percentage.toFixed(2),
      ca2Percentage: ca2Percentage.toFixed(2),
      caContribution: caContribution.toFixed(2),
      caTrend,
      caRecommendation,
    };
  };

  const getTutorialChartData = (rollNo) => {
    return (tutorialMarks[rollNo] || []).map((t) => ({
      name: `T${t.tutorialId}`,
      marks: t.marks,
      maxMarks: t.maxMarks,
    }));
  };

  const getCAChartData = (student) => [
    { name: "CA1", marks: student.ca1, maxMarks: 20 },
    { name: "CA2", marks: student.ca2, maxMarks: 20 },
  ];

  const exportPDF = async (student) => {
    const doc = new jsPDF();
    const { percentage, grade, isPoor, recommendation } = calculatePerformance(student);
    const caAnalysis = analyzeCAPerformance(student);

    doc.text(`Individual Performance Report: ${student.studentName} (${student.rollNo})`, 14, 10);
    doc.text(`Course: ${courseName} | Class: ${student.className.toUpperCase()}`, 14, 20);

    autoTable(doc, {
      head: [["Component", "Marks", "Max Marks"]],
      body: [
        ["Tutorial", student.tutorial.toFixed(2), 15],
        ["Assignment", student.assignment, 15],
        ["CA1", student.ca1, 20],
        ["CA2", student.ca2, 20],
        ["CA Total", student.caTotal.toFixed(2), 20],
        ["Total", student.total.toFixed(2), 50],
      ],
      startY: 30,
    });

    const tutorials = tutorialMarks[student.rollNo] || [];
    if (tutorials.length > 0) {
      doc.text("Tutorial Details:", 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        head: [["Tutorial ID", "Marks", "Max Marks"]],
        body: tutorials.map((t) => [t.tutorialId, t.marks, t.maxMarks]),
        startY: doc.lastAutoTable.finalY + 20,
      });
    }

    doc.text("CA Performance Analysis:", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: [
        ["CA1 Percentage", `${caAnalysis.ca1Percentage}%`],
        ["CA2 Percentage", `${caAnalysis.ca2Percentage}%`],
        ["CA Contribution to Total", `${caAnalysis.caContribution}%`],
        ["CA Trend", caAnalysis.caTrend],
        ["CA Recommendation", caAnalysis.caRecommendation],
      ],
      startY: doc.lastAutoTable.finalY + 20,
    });

    doc.text("Overall Performance Metrics:", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: [
        ["Percentage", `${percentage}%`],
        ["Grade", grade],
        ["Performance Status", isPoor ? "Poor (Below 50%)" : "Satisfactory"],
        ["Tutorial Trend", getTutorialTrend(student.rollNo)],
        ["Recommendation", recommendation],
      ],
      startY: doc.lastAutoTable.finalY + 20,
    });

    let finalY = doc.lastAutoTable.finalY + 20;
    if (tutorials.length > 0 && document.getElementById("tutorial-chart")) {
      const tutorialCanvas = await html2canvas(document.getElementById("tutorial-chart"));
      const tutorialImg = tutorialCanvas.toDataURL("image/png");
      doc.text("Tutorial Performance Chart:", 14, finalY);
      doc.addImage(tutorialImg, "PNG", 14, finalY + 10, 180, 60);
      finalY += 80;
    }

    if (caChartRef.current) {
      const caCanvas = await html2canvas(caChartRef.current);
      const caImg = caCanvas.toDataURL("image/png");
      doc.text("CA Performance Chart:", 14, finalY);
      doc.addImage(caImg, "PNG", 14, finalY + 10, 180, 60);
    }

    doc.save(`Individual_Report_${student.rollNo}_${courseName}.pdf`);
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Individual Student Performance</h1>
        <p>Select a course and class to view student reports</p>
      </div>

      <div className="report-section">
        <h2>Select Course</h2>
        <select
          value={courseId}
          onChange={(e) => {
            const selectedCourse = courses.find((c) => c._id === e.target.value);
            setCourseId(e.target.value);
            setCourseName(selectedCourse ? selectedCourse.courseName : "");
            setStudents([]);
            setSelectedStudent(null);
          }}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseName}
            </option>
          ))}
        </select>
      </div>

      <div className="report-section">
        <h2>Select Class</h2>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={!courseId}
        >
          <option value="All">All</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="report-section">
        <h2>Search by Roll Number</h2>
        <input
          type="text"
          value={rollNoSearch}
          onChange={(e) => setRollNoSearch(e.target.value)}
          placeholder="Enter roll number"
          disabled={!courseId}
        />
        <div className="button-container">
          <button onClick={handleSearch} className="export-btn" disabled={!courseId}>
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : students.length > 0 ? (
        <>
          <div className="report-section student-list">
            <h2>Students in {selectedClass.toUpperCase()}</h2>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.rollNo}>
                    <td>{student.studentName}</td>
                    <td>{student.rollNo}</td>
                    <td>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="export-btn"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedStudent && (
            <div className="popup-overlay">
              <div ref={popupRef} className="report-popup">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="popup-close-btn"
                >
                  ×
                </button>
                <div className="report-header">
                  <h1>
                    Report: {selectedStudent.studentName} ({selectedStudent.rollNo})
                  </h1>
                  <p>
                    Course: {courseName} | Class: {selectedStudent.className.toUpperCase()}
                  </p>
                </div>

                <div className="report-section">
                  <h2>Marks</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Marks</th>
                        <th>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Tutorial</td>
                        <td>{selectedStudent.tutorial.toFixed(2)}</td>
                        <td>15</td>
                      </tr>
                      <tr>
                        <td>Assignment</td>
                        <td>{selectedStudent.assignment}</td>
                        <td>15</td>
                      </tr>
                      <tr>
                        <td>CA1</td>
                        <td>{selectedStudent.ca1}</td>
                        <td>20</td>
                      </tr>
                      <tr>
                        <td>CA2</td>
                        <td>{selectedStudent.ca2}</td>
                        <td>20</td>
                      </tr>
                      <tr>
                        <td>CA Total</td>
                        <td>{selectedStudent.caTotal.toFixed(2)}</td>
                        <td>20</td>
                      </tr>
                      <tr>
                        <td>Total</td>
                        <td>{selectedStudent.total.toFixed(2)}</td>
                        <td>50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {tutorialMarks[selectedStudent.rollNo]?.length > 0 && (
                  <div className="report-section tutorial-group">
                    <h2>Tutorial Details</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Tutorial ID</th>
                          <th>Marks</th>
                          <th>Max Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tutorialMarks[selectedStudent.rollNo].map((t) => (
                          <tr key={t.tutorialId}>
                            <td>{t.tutorialId}</td>
                            <td>{t.marks}</td>
                            <td>{t.maxMarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h2>Tutorial Performance Chart</h2>
                    <div id="tutorial-chart">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={getTutorialChartData(selectedStudent.rollNo)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, "auto"]} />
                          <Tooltip />
                          <Bar dataKey="marks" fill="#460343" />
                          <Bar dataKey="maxMarks" fill="#03460f" opacity={0.3} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="report-section">
                  <h2>CA Performance Analysis</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>CA1 Percentage</td>
                        <td>{analyzeCAPerformance(selectedStudent).ca1Percentage}%</td>
                      </tr>
                      <tr>
                        <td>CA2 Percentage</td>
                        <td>{analyzeCAPerformance(selectedStudent).ca2Percentage}%</td>
                      </tr>
                      <tr>
                        <td>CA Contribution to Total</td>
                        <td>{analyzeCAPerformance(selectedStudent).caContribution}%</td>
                      </tr>
                      <tr>
                        <td>CA Trend</td>
                        <td>{analyzeCAPerformance(selectedStudent).caTrend}</td>
                      </tr>
                      <tr>
                        <td>CA Recommendation</td>
                        <td>{analyzeCAPerformance(selectedStudent).caRecommendation}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h2>CA Performance Chart</h2>
                  <div ref={caChartRef}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={getCAChartData(selectedStudent)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 20]} />
                        <Tooltip />
                        <Bar dataKey="marks" fill="#460343" />
                        <Bar dataKey="maxMarks" fill="#03460f" opacity={0.3} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="report-section">
                  <h2>Overall Performance Metrics</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Percentage</td>
                        <td>{calculatePerformance(selectedStudent).percentage}%</td>
                      </tr>
                      <tr>
                        <td>Grade</td>
                        <td>{calculatePerformance(selectedStudent).grade}</td>
                      </tr>
                      <tr>
                        <td>Performance Status</td>
                        <td>
                          {calculatePerformance(selectedStudent).isPoor
                            ? "Poor (Below 50%)"
                            : "Satisfactory"}
                        </td>
                      </tr>
                      <tr>
                        <td>Tutorial Trend</td>
                        <td>{getTutorialTrend(selectedStudent.rollNo)}</td>
                      </tr>
                      <tr>
                        <td>Recommendation</td>
                        <td>{calculatePerformance(selectedStudent).recommendation}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="button-container">
                  <button
                    onClick={() => exportPDF(selectedStudent)}
                    className="export-btn"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : courseId ? (
        <p>No data available for the selected class: {selectedClass.toUpperCase()}.</p>
      ) : (
        <p>Please select a course.</p>
      )}
    </div>
  );
};

export default IndividualReport;