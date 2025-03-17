import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/Reports.css"; // Ensure the CSS file is correctly linked

const Consolidate = () => {
  const { courseId } = useParams();
  const [marksData, setMarksData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [assignmentMarks, setAssignmentMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculationOption, setCalculationOption] = useState("average");

  useEffect(() => {
    fetchMarks();
    fetchAssignmentMarks();
  }, [courseId]);

  const fetchMarks = async () => {
    try {
      const marksRes = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      setMarksData(marksRes.data);

      const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      setCourseName(courseRes.data.courseName);
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch saved assignment marks from API
  const fetchAssignmentMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/assignment-marks/${courseId}/1`); // Fetch for Assignment 1
      const assignmentMarksData = {};
      res.data.forEach((entry) => {
        assignmentMarksData[entry.rollNo] = entry.marks;
      });
      setAssignmentMarks(assignmentMarksData);
    } catch (error) {
      console.error("Error fetching assignment marks:", error);
    }
  };

  const groupMarksByStudent = () => {
    const studentMarks = marksData.reduce((groups, mark) => {
      const { studentName, rollNo, tutorialId, marks, maxMarks } = mark;

      if (!groups[rollNo]) {
        groups[rollNo] = {
          studentName,
          rollNo,
          tutorialMarks: {},
          assignmentMarks: assignmentMarks[rollNo] || "N/A", // ✅ Use fetched assignment marks
        };
      }

      groups[rollNo].tutorialMarks[tutorialId] = { marks, maxMarks };
      return groups;
    }, {});

    return studentMarks;
  };

  const calculateTotalMarks = (tutorialMarks, assignmentMarks) => {
    const marksArray = Object.values(tutorialMarks).map((t) => t.marks);
    let total = marksArray.length === 0 ? 0 : (calculationOption === "best" ? Math.max(...marksArray) : marksArray.reduce((acc, mark) => acc + mark, 0) / marksArray.length);
    return total + (assignmentMarks !== "N/A" ? assignmentMarks : 0); // ✅ Add assignment marks to total
  };

  const groupedMarks = groupMarksByStudent();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Consolidated Report: ${courseName}`, 14, 10);

    const tableData = [];
    const firstStudent = groupedMarks[Object.keys(groupedMarks)[0]];
    const tutorialHeaders = firstStudent ? Object.keys(firstStudent.tutorialMarks).map((tid) => `Tutorial ${tid}`) : [];
    const tableHeaders = ["Student Name", "Roll Number", ...tutorialHeaders, "Assignment Marks", "Total Marks"];

    Object.keys(groupedMarks).forEach((studentId) => {
      const student = groupedMarks[studentId];
      const totalMarks = calculateTotalMarks(student.tutorialMarks, student.assignmentMarks);
      const rowData = [
        student.studentName,
        student.rollNo,
        ...tutorialHeaders.map((tid) => `${student.tutorialMarks[tid]?.marks || "N/A"} / ${student.tutorialMarks[tid]?.maxMarks || "N/A"}`),
        student.assignmentMarks,
        totalMarks,
      ];
      tableData.push(rowData);
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 20,
    });

    doc.save(`Consolidated_Report_${courseName}.pdf`);
  };

  return (
    <div className="reports-container">
      <h2>Consolidated Report: {courseName}</h2>

      <div>
        <label>
          <input type="radio" value="average" checked={calculationOption === "average"} onChange={() => setCalculationOption("average")} />
          Average of all marks
        </label>
        <label>
          <input type="radio" value="best" checked={calculationOption === "best"} onChange={() => setCalculationOption("best")} />
          Best of all marks
        </label>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          {Object.keys(groupedMarks).length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    {Object.keys(groupedMarks[Object.keys(groupedMarks)[0]]?.tutorialMarks || {}).map((tutorialId) => (
                      <th key={tutorialId}>Tutorial {tutorialId}</th>
                    ))}
                    <th>Assignment Marks</th>
                    <th>Total Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedMarks).map((studentId) => {
                    const student = groupedMarks[studentId];
                    const totalMarks = calculateTotalMarks(student.tutorialMarks, student.assignmentMarks);

                    return (
                      <tr key={studentId}>
                        <td>{student.studentName}</td>
                        <td>{student.rollNo}</td>
                        {Object.keys(student.tutorialMarks).map((tutorialId) => {
                          const { marks, maxMarks } = student.tutorialMarks[tutorialId];
                          return <td key={tutorialId}>{marks || "N/A"} / {maxMarks || "N/A"}</td>;
                        })}
                        <td>{student.assignmentMarks}</td>
                        <td>{totalMarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="button-container">
                <button onClick={exportPDF} className="export-btn">Export as PDF</button>
              </div>
            </>
          ) : (
            <p>No data available for this course.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Consolidate;
