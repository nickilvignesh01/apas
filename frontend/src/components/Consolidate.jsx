import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/Reports.css";

const Consolidate = () => {
  const { courseId } = useParams();
  const [marksData, setMarksData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [assignmentMarks, setAssignmentMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("All");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("rollNo"); // 'rollNo', 'asc', 'desc'

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [marksRes, courseRes, classesRes, assignmentRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`),
        axios.get(`http://localhost:5000/api/course/${courseId}`),
        axios.get(`http://localhost:5000/api/classes`),
        axios.get(`http://localhost:5000/api/assignment-marks/${courseId}/1`),
      ]);

      setMarksData(marksRes.data);
      setCourseName(courseRes.data.courseName || "Unknown Course");
      setAvailableClasses(classesRes.data.map((cls) => cls.name.toLowerCase()));
      const assignmentMap = {};
      assignmentRes.data.forEach((entry) => {
        assignmentMap[entry.rollNo] = entry.marks;
      });
      setAssignmentMarks(assignmentMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please check the server and try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractNumericRoll = (rollNo) => {
    const match = rollNo.match(/\d+$/);
    return match ? parseInt(match[0]) : 0;
  };

  const groupMarksByStudent = () => {
    const selected = selectedClass.trim().toLowerCase();

    const filtered =
      selected === "all"
        ? marksData
        : marksData.filter((entry) => (entry.className?.trim().toLowerCase() || "unknown") === selected);

    const studentMarks = filtered.reduce((groups, mark) => {
      const { studentName, rollNo, tutorialId, marks, maxMarks } = mark;
      if (!rollNo || !tutorialId) return groups;

      if (!groups[rollNo]) {
        groups[rollNo] = {
          studentName: studentName || rollNo,
          rollNo,
          tutorialMarks: {},
          assignmentMarks: assignmentMarks?.[rollNo] || "N/A",
        };
      }

      groups[rollNo].tutorialMarks[tutorialId] = {
        marks: marks ?? 0,
        maxMarks: maxMarks ?? 0,
      };
      return groups;
    }, {});

    let grouped = Object.values(studentMarks);

    // Sort based on selected option
    if (sortOrder === "asc" || sortOrder === "desc") {
      grouped.sort((a, b) => {
        const totalA = calculateTotalMarks(a.tutorialMarks, a.assignmentMarks);
        const totalB = calculateTotalMarks(b.tutorialMarks, b.assignmentMarks);
        return sortOrder === "asc" ? totalA - totalB : totalB - totalA;
      });
    } else {
      grouped.sort((a, b) => extractNumericRoll(a.rollNo) - extractNumericRoll(b.rollNo));
    }

    return grouped;
  };

  const calculateTutorialMarksOutOf15 = (tutorialMarks) => {
    let totalObtained = 0;
    let totalMax = 0;

    Object.values(tutorialMarks).forEach(({ marks, maxMarks }) => {
      totalObtained += marks || 0;
      totalMax += maxMarks || 0;
    });

    return totalMax === 0 ? 0 : (totalObtained / totalMax) * 15;
  };

  const calculateTotalMarks = (tutorialMarks, assignmentMark) => {
    const tutorialOutOf15 = calculateTutorialMarksOutOf15(tutorialMarks);
    const assignmentScore = assignmentMark !== "N/A" ? parseFloat(assignmentMark) : 0;
    return tutorialOutOf15 + assignmentScore;
  };

  const exportPDF = () => {
    const groupedMarks = groupMarksByStudent();
    const doc = new jsPDF();
    doc.text(
      `Consolidated Report: ${courseName}${selectedClass !== "All" ? ` (Class: ${selectedClass.toUpperCase()})` : ""}`,
      14,
      10
    );

    const tableData = [];
    const firstStudent = groupedMarks[0];
    const tutorialHeaders = firstStudent
      ? Object.keys(firstStudent.tutorialMarks).map((tid) => `Tutorial ${tid}`)
      : [];
    const tableHeaders = ["Student Name", "Roll No", ...tutorialHeaders, "Tutorial (Out of 15)", "Assignment", "Total"];

    groupedMarks.forEach((student) => {
      const tutorialOutOf15 = calculateTutorialMarksOutOf15(student.tutorialMarks);
      const totalMarks = calculateTotalMarks(student.tutorialMarks, student.assignmentMarks);

      const row = [
        student.studentName,
        student.rollNo,
        ...tutorialHeaders.map(
          (tid) => `${student.tutorialMarks[tid]?.marks ?? "N/A"} / ${student.tutorialMarks[tid]?.maxMarks ?? "N/A"}`
        ),
        tutorialOutOf15.toFixed(2),
        student.assignmentMarks,
        totalMarks.toFixed(2),
      ];

      tableData.push(row);
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 20,
    });

    doc.save(`Consolidated_Report_${courseName}_${selectedClass}.pdf`);
  };

  const groupedMarks = groupMarksByStudent();

  return (
    <div className="reports-container">
      <h2>Consolidated Report: {courseName || "Loading..."}</h2>

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

        <label style={{ marginLeft: "1rem" }}>Sort By: </label>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="rollNo">Roll No</option>
          <option value="asc">Marks: Low to High</option>
          <option value="desc">Marks: High to Low</option>
        </select>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : groupedMarks.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                {Object.keys(groupedMarks[0]?.tutorialMarks || {}).map((tutorialId) => (
                  <th key={tutorialId}>Tutorial {tutorialId}</th>
                ))}
                <th>Tutorial (Out of 15)</th>
                <th>Assignment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupedMarks.map((student) => {
                const tutorialOutOf15 = calculateTutorialMarksOutOf15(student.tutorialMarks);
                const total = calculateTotalMarks(student.tutorialMarks, student.assignmentMarks);

                return (
                  <tr key={student.rollNo}>
                    <td>{student.studentName}</td>
                    <td>{student.rollNo}</td>
                    {Object.keys(student.tutorialMarks).map((tid) => {
                      const { marks, maxMarks } = student.tutorialMarks[tid];
                      return (
                        <td key={tid}>
                          {marks ?? "N/A"} / {maxMarks ?? "N/A"}
                        </td>
                      );
                    })}
                    <td>{tutorialOutOf15.toFixed(2)}</td>
                    <td>{student.assignmentMarks}</td>
                    <td>{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="button-container">
            <button className="export-btn" onClick={exportPDF}>
              Export as PDF
            </button>
          </div>
        </>
      ) : (
        <p>No data available for the selected class: {selectedClass.toUpperCase()}.</p>
      )}
    </div>
  );
};

export default Consolidate;
