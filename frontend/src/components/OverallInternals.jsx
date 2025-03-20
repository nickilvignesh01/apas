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
  const roundMarks = (marks) => (marks >= 12.5 ? Math.ceil(marks) : Math.floor(marks));

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

  // ✅ Fetch Marks Data
  const fetchMarksData = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    try {
      const [tutorialRes, assignmentRes, ca1Res, ca2Res] = await Promise.allSettled([
        axios.get(`http://localhost:5000/api/tutorial-marks/${selectedCourseId}`),
        axios.get(`http://localhost:5000/api/assignment-marks/${selectedCourseId}/1`),
        axios.get("http://localhost:5000/api/assessment/marks", {
          params: { courseId: selectedCourseId, assessmentId: "CA1" },
        }),
        axios.get("http://localhost:5000/api/assessment/marks", {
          params: { courseId: selectedCourseId, assessmentId: "CA2" },
        }),
      ]);

      const tutorialMarks = {};
      if (tutorialRes.status === "fulfilled") {
        tutorialRes.value.data.forEach((entry) => {
          if (!tutorialMarks[entry.rollNo]) tutorialMarks[entry.rollNo] = [];
          tutorialMarks[entry.rollNo].push({ marks: entry.marks, maxMarks: entry.maxMarks });
        });
      }

      const calculateTutorialMarksOutOf15 = (tutorials) => {
        if (!tutorials || tutorials.length === 0) return 0;
        let totalObtained = 0, totalMax = 0;
        tutorials.forEach(({ marks, maxMarks }) => {
          totalObtained += marks;
          totalMax += maxMarks;
        });
        return totalMax === 0 ? 0 : (totalObtained / totalMax) * 15;
      };

      const assignmentMarks = {};
      if (assignmentRes.status === "fulfilled") {
        assignmentRes.value.data.forEach((entry) => {
          assignmentMarks[entry.rollNo] = entry.marks;
        });
      }

      const ca1Marks = {}, ca2Marks = {};
      if (ca1Res.status === "fulfilled") {
        ca1Res.value.data.forEach((entry) => {
          ca1Marks[entry.rollNo] = roundMarks(entry.marks);
        });
      }
      if (ca2Res.status === "fulfilled") {
        ca2Res.value.data.forEach((entry) => {
          ca2Marks[entry.rollNo] = roundMarks(entry.marks);
        });
      }

      // ✅ Combine all students based on roll numbers
      const allStudents = [
        ...new Set([
          ...Object.keys(tutorialMarks),
          ...Object.keys(assignmentMarks),
          ...Object.keys(ca1Marks),
          ...Object.keys(ca2Marks),
        ]),
      ];

      const studentsData = allStudents.map((rollNo) => {
        const tutorial = calculateTutorialMarksOutOf15(tutorialMarks[rollNo]).toFixed(2);
        const assignment = assignmentMarks[rollNo] || 0;
        const ca1 = ca1Marks[rollNo] || 0;
        const ca2 = ca2Marks[rollNo] || 0;
        const caTotal = ((ca1 + ca2) / 2).toFixed(2);

        return {
          studentName: tutorialRes.status === "fulfilled"
            ? tutorialRes.value.data.find((s) => s.rollNo === rollNo)?.studentName || "N/A"
            : "N/A",
          rollNo, tutorial, assignment, ca1, ca2, caTotal,
          total: (parseFloat(tutorial) + assignment + parseFloat(caTotal)).toFixed(2),
        };
      });

      setStudents(studentsData);
      saveTotalMarks(studentsData, selectedCourseId);
    } catch (error) {
      console.error("❌ Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save Total Marks to Backend
  const saveTotalMarks = async (studentsData, courseId) => {
    try {
      await axios.post("http://localhost:5000/api/overall-marks/save", { students: studentsData, courseId });
      console.log("✅ Total marks saved successfully!");
    } catch (error) {
      console.error("❌ Error saving total marks:", error);
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
                <th>CA Total</th>
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
                  <td>{student.caTotal}</td>
                  <td>{student.total}</td>
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
