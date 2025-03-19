import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Reports.css";

const OverallInternals = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchMarksData(courseId);
  }, [courseId]);

  // ✅ Function to round CA Marks properly
  const roundMarks = (marks) => {
    if (!marks) return 0;
    return marks >= 12.5 ? Math.ceil(marks) : Math.floor(marks);
  };

  // ✅ Fetch Courses
  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/course"); // ✅ Matches backend route
      console.log("✅ Courses fetched:", res.data);

      if (res.data.length > 0) {
        setCourses(res.data);
        setCourseId(res.data[0]._id); // Auto-select first course
      } else {
        setError("No courses found.");
      }
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      setError("Failed to load courses.");
    }
  };

  // ✅ Fetch tutorial, assignment, CA-1, and CA-2 marks
  const fetchMarksData = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    try {
      const [tutorialRes, assignmentRes, ca1Res, ca2Res] = await Promise.allSettled([
        axios.get(`http://localhost:5000/api/tutorial-marks/${selectedCourseId}`),
        axios.get(`http://localhost:5000/api/assignment-marks/${selectedCourseId}/1`), // ✅ Matches `AssignmentMarks.jsx`
        axios.get("http://localhost:5000/api/assessment/marks", {
          params: { courseId: selectedCourseId, assessmentId: "CA1" },
        }),
        axios.get("http://localhost:5000/api/assessment/marks", {
          params: { courseId: selectedCourseId, assessmentId: "CA2" },
        }),
      ]);

      console.log("✅ API Responses:", { tutorialRes, assignmentRes, ca1Res, ca2Res });

      // ✅ Extract tutorial marks and convert to 15
      const tutorialMarks = {};
      if (tutorialRes.status === "fulfilled") {
        tutorialRes.value.data.forEach((entry) => {
          if (!tutorialMarks[entry.rollNo]) tutorialMarks[entry.rollNo] = [];
          tutorialMarks[entry.rollNo].push({ marks: entry.marks, maxMarks: entry.maxMarks });
        });
      }

      // ✅ Convert Tutorial Marks to 15
      const calculateTutorialMarksOutOf15 = (tutorials) => {
        if (!tutorials || tutorials.length === 0) return 0;
        let totalObtained = 0;
        let totalMax = 0;

        tutorials.forEach(({ marks, maxMarks }) => {
          totalObtained += marks;
          totalMax += maxMarks;
        });

        if (totalMax === 0) return 0; // Prevent division by zero
        return (totalObtained / totalMax) * 15; // Scale to 15
      };

      // ✅ Extract assignment marks
      const assignmentMarks = {};
      if (assignmentRes.status === "fulfilled") {
        assignmentRes.value.data.forEach((entry) => {
          assignmentMarks[entry.rollNo] = entry.marks;
        });
      }

      // ✅ Extract CA-1 marks and round to 2 decimal places
      const ca1Marks = {};
      if (ca1Res.status === "fulfilled") {
        ca1Res.value.data.forEach((entry) => {
          ca1Marks[entry.rollNo] = roundMarks(entry.marks);
        });
      }

      // ✅ Extract CA-2 marks and round to 2 decimal places
      const ca2Marks = {};
      if (ca2Res.status === "fulfilled") {
        ca2Res.value.data.forEach((entry) => {
          ca2Marks[entry.rollNo] = roundMarks(entry.marks);
        });
      }

      // ✅ Calculate CA Total as (CA1 + CA2) / 2
      const calculateCATotal = (ca1, ca2) => {
        return ((ca1 + ca2) / 2).toFixed(2);
      };

      // ✅ Combine all students based on roll numbers
      const allStudents = [
        ...new Set([
          ...Object.keys(tutorialMarks),
          ...Object.keys(assignmentMarks),
          ...Object.keys(ca1Marks),
          ...Object.keys(ca2Marks),
        ]),
      ];

      const studentData = allStudents.map((rollNo) => {
        const tutorialOutOf15 = calculateTutorialMarksOutOf15(tutorialMarks[rollNo]);
        const assignmentScore = assignmentMarks[rollNo] || 0;
        const ca1Score = ca1Marks[rollNo] || 0;
        const ca2Score = ca2Marks[rollNo] || 0;
        const caTotal = calculateCATotal(ca1Score, ca2Score);

        return {
          studentName: tutorialRes.status === "fulfilled"
            ? tutorialRes.value.data.find((s) => s.rollNo === rollNo)?.studentName || "N/A"
            : "N/A",
          rollNo,
          tutorial: tutorialOutOf15.toFixed(2), // ✅ Now displays tutorial marks out of 15
          assignment: assignmentScore,
          ca1: ca1Score, // ✅ Rounded CA1 Marks
          ca2: ca2Score, // ✅ Rounded CA2 Marks
          caTotal, // ✅ New CA Total Column
          total: (tutorialOutOf15 + assignmentScore + parseFloat(caTotal)).toFixed(2), // ✅ Final total
        };
      });

      setStudents(studentData);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to fetch marks. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="internals-container">
      <h2>Overall Internals Result</h2>

      {/* ✅ Course Selection Dropdown */}
      <label>Select Course:</label>
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.courseName}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        students.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Tutorial (Out of 15)</th>
                <th>Assignment</th>
                <th>CA-1</th>
                <th>CA-2</th>
                <th>CA Total</th> {/* ✅ New CA Total Column */}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.studentName}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.tutorial}</td>
                  <td>{student.assignment}</td>
                  <td>{student.ca1}</td>
                  <td>{student.ca2}</td>
                  <td>{student.caTotal}</td> {/* ✅ Rounded CA Total */}
                  <td>{student.total}</td> {/* ✅ Final Total */}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default OverallInternals;
