import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "../css/Reports.css";

const SendMail = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutorialMarks, setTutorialMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchStudents();
  }, [courseId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesRes = await axios.get("${process.env.REACT_APP_API}/api/course");
      if (coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
        setCourseId(coursesRes.data[0]._id);
      } else {
        setError("No courses found.");
      }
    } catch (error) {
      console.error("Error fetching courses:", error.message, error.response?.status);
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!courseId) {
      setError("No course selected.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching students for courseId:", courseId);

      const [overallMarksRes, tutorialMarksRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/overall-marks/${courseId}`),
        axios.get(`${process.env.REACT_APP_API}/api/tutorial-marks/${courseId}`),
      ]);

      const classNames = [...new Set(overallMarksRes.data.map((mark) => mark.className))];
      if (!classNames.length) {
        setError("No class names found for this course.");
        setLoading(false);
        return;
      }

      const studentsRes = await Promise.all(
        classNames.map((className) =>
          axios.get(`${process.env.REACT_APP_API}/api/students?className=${encodeURIComponent(className)}`)
        )
      );
      const allStudents = studentsRes.flatMap((res) => res.data);

      const lowPerformingStudents = overallMarksRes.data
        .map((mark) => {
          const internalMarks = (mark.total / 50) * 40;
          if (internalMarks >= 18) return null;
          const student = allStudents.find((s) => s.rollNo.toLowerCase() === mark.rollNo.toLowerCase());
          if (!student) {
            console.warn(`No student data for rollNo: ${mark.rollNo}`);
            return null;
          }
          return {
            rollNo: mark.rollNo,
            studentName: mark.studentName || "N/A",
            className: mark.className || "unknown",
            emailId: `${mark.rollNo.toLowerCase()}@psgtech.ac.in`, // Use rollNo@psgtech.ac.in
            internalMarks: internalMarks.toFixed(2),
            total: parseFloat(mark.total) || 0,
            tutorial: parseFloat(mark.tutorial) || 0,
            assignment: parseFloat(mark.assignment) || 0,
            ca1: parseFloat(mark.ca1) || 0,
            ca2: parseFloat(mark.ca2) || 0,
            caTotal: parseFloat(mark.caTotal) || 0,
          };
        })
        .filter(Boolean);

      if (lowPerformingStudents.length === 0) {
        setError("No low-performing students found for this course.");
      }

      setStudents(lowPerformingStudents);
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
      console.error("Error fetching students:", error.message, error.response?.status);
      setError("Failed to fetch student data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTargetMainMark = (internalMarks) => {
    const internal = parseFloat(internalMarks);
    const requiredMainConverted = 45 - internal;
    const requiredMain = Math.max((requiredMainConverted * 100) / 60, 45);
    const targetMain = requiredMain + 10;
    return targetMain.toFixed(2);
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

  const generatePDF = async (student, courseName) => {
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
    if (tutorials.length > 0 && document.getElementById(`tutorial-chart-${student.rollNo}`)) {
      const tutorialCanvas = await html2canvas(document.getElementById(`tutorial-chart-${student.rollNo}`));
      const tutorialImg = tutorialCanvas.toDataURL("image/png");
      doc.text("Tutorial Performance Chart:", 14, finalY);
      doc.addImage(tutorialImg, "PNG", 14, finalY + 10, 180, 60);
      finalY += 80;
    }

    if (document.getElementById(`ca-chart-${student.rollNo}`)) {
      const caCanvas = await html2canvas(document.getElementById(`ca-chart-${student.rollNo}`));
      const caImg = caCanvas.toDataURL("image/png");
      doc.text("CA Performance Chart:", 14, finalY);
      doc.addImage(caImg, "PNG", 14, finalY + 10, 180, 60);
    }

    const pdfBlob = doc.output("blob");
    console.log(`📄 PDF generated for ${student.rollNo}, size: ${pdfBlob.size} bytes`);
    return pdfBlob;
  };

  const sendEmail = async (student) => {
    try {
      setSending((prev) => ({ ...prev, [student.rollNo]: true }));
      const course = courses.find((c) => c._id === courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.emailId)) {
        throw new Error(`Invalid email address: ${student.emailId}`);
      }

      console.log("📧 Preparing to send email to:", {
        emailId: student.emailId,
        rollNo: student.rollNo,
        studentName: student.studentName,
      });

      const pdfBlob = await generatePDF(student, course.courseName);
      const targetMainMark = calculateTargetMainMark(student.internalMarks);

      const formData = new FormData();
      formData.append("emailId", student.emailId);
      formData.append("studentName", student.studentName);
      formData.append("rollNo", student.rollNo);
      formData.append("targetMainMark", targetMainMark);
      formData.append("pdf", pdfBlob, `Individual_Report_${student.rollNo}_${course.courseName}.pdf`);

      const response = await axios.post("${process.env.REACT_APP_API}/api/send-email", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Email sent successfully:", response.data);
      alert(`Email sent successfully to ${student.studentName} (${student.emailId})`);
    } catch (error) {
      console.error("❌ Error sending email:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.details
        ? `Failed to send email: ${error.response.data.details}`
        : error.message
        ? `Failed to send email: ${error.message}`
        : "Failed to send email: Unknown error";
      alert(errorMessage);
    } finally {
      setSending((prev) => ({ ...prev, [student.rollNo]: false }));
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Send Performance Reports</h1>
        <p>Select a course to view low-performing students and send reports</p>
      </div>

      <div className="report-section">
        <h2>Select Course</h2>
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setStudents([]);
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

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : students.length > 0 ? (
        <div className="report-section student-list">
          <h2>Low-Performing Students (Internal Marks &lt; 18/40)</h2>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Internal Marks (out of 40)</th>
                <th>Target Main Exam Mark (out of 100)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.studentName}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.internalMarks}</td>
                  <td>{calculateTargetMainMark(student.internalMarks)}</td>
                  <td>
                    <button
                      onClick={() => sendEmail(student)}
                      className="export-btn"
                      disabled={sending[student.rollNo]}
                    >
                      {sending[student.rollNo] ? "Sending..." : "Send Email"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ position: "absolute", left: "-9999px" }}>
            {students.map((student) => (
              <div key={student.rollNo}>
                {tutorialMarks[student.rollNo]?.length > 0 && (
                  <div id={`tutorial-chart-${student.rollNo}`}>
                    <ResponsiveContainer width={600} height={250}>
                      <BarChart
                        data={getTutorialChartData(student.rollNo)}
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
                )}
                <div id={`ca-chart-${student.rollNo}`}>
                  <ResponsiveContainer width={600} height={250}>
                    <BarChart
                      data={getCAChartData(student)}
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
            ))}
          </div>
        </div>
      ) : courseId ? (
        <p>No low-performing students found for the selected course.</p>
      ) : (
        <p>Please select a course.</p>
      )}
    </div>
  );
};

export default SendMail;