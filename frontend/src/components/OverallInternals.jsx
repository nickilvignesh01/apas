import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Reports.css";

const OverallInternals = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) fetchMarksData(courseId);
  }, [courseId, selectedClass]);

  // ✅ Function to round CA Marks properly
  const roundMarks = (marks) => (marks >= 12.5 ? Math.ceil(marks) : Math.floor(marks));

  // ✅ Fetch Courses and Classes
  const fetchCourses = async () => {
    try {
      const [coursesRes, classesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/course"),
        axios.get("http://localhost:5000/api/classes"),
      ]);

      console.log("Courses Response:", coursesRes.data);
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

      const selected = selectedClass.trim().toLowerCase();

      // Process Tutorial Marks
      const tutorialMarks = {};
      let classNameMap = {}; // Map rollNo to className
      if (tutorialRes.status === "fulfilled") {
        const filteredTutorials =
          selected === "all"
            ? tutorialRes.value.data
            : tutorialRes.value.data.filter((entry) => {
                const entryClass = entry.className?.trim().toLowerCase() || "unknown";
                console.log("Comparing Tutorial:", entryClass, selected);
                return entryClass === selected;
              });

        filteredTutorials.forEach((entry) => {
          if (!tutorialMarks[entry.rollNo]) tutorialMarks[entry.rollNo] = [];
          tutorialMarks[entry.rollNo].push({ marks: entry.marks, maxMarks: entry.maxMarks });
          classNameMap[entry.rollNo] = entry.className; // Store className
        });
      }

      // Calculate Tutorial Marks Out of 15
      const calculateTutorialMarksOutOf15 = (tutorials) => {
        if (!tutorials || tutorials.length === 0) return 0;
        let totalObtained = 0,
          totalMax = 0;
        tutorials.forEach(({ marks, maxMarks }) => {
          totalObtained += marks || 0;
          totalMax += maxMarks || 0;
        });
        return totalMax === 0 ? 0 : (totalObtained / totalMax) * 15;
      };

      // Process Assignment Marks
      const assignmentMarks = {};
      if (assignmentRes.status === "fulfilled") {
        const filteredAssignments =
          selected === "all"
            ? assignmentRes.value.data
            : assignmentRes.value.data.filter((entry) => {
                const entryClass = entry.className?.trim().toLowerCase() || "unknown";
                console.log("Comparing Assignment:", entryClass, selected);
                return entryClass === selected;
              });

        filteredAssignments.forEach((entry) => {
          assignmentMarks[entry.rollNo] = entry.marks;
          if (!classNameMap[entry.rollNo]) classNameMap[entry.rollNo] = entry.className; // Update className
        });
      }

      // Process CA1 and CA2 Marks
      const ca1Marks = {},
        ca2Marks = {};
      if (ca1Res.status === "fulfilled") {
        const filteredCA1 =
          selected === "all"
            ? ca1Res.value.data
            : ca1Res.value.data.filter((entry) => {
                const entryClass = entry.className?.trim().toLowerCase() || "unknown";
                console.log("Comparing CA1:", entryClass, selected);
                return entryClass === selected;
              });

        filteredCA1.forEach((entry) => {
          ca1Marks[entry.rollNo] = roundMarks(entry.marks);
          if (!classNameMap[entry.rollNo]) classNameMap[entry.rollNo] = entry.className; // Update className
        });
      }
      if (ca2Res.status === "fulfilled") {
        const filteredCA2 =
          selected === "all"
            ? ca2Res.value.data
            : ca2Res.value.data.filter((entry) => {
                const entryClass = entry.className?.trim().toLowerCase() || "unknown";
                console.log("Comparing CA2:", entryClass, selected);
                return entryClass === selected;
              });

        filteredCA2.forEach((entry) => {
          ca2Marks[entry.rollNo] = roundMarks(entry.marks);
          if (!classNameMap[entry.rollNo]) classNameMap[entry.rollNo] = entry.className; // Update className
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
          studentName:
            tutorialRes.status === "fulfilled"
              ? tutorialRes.value.data.find((s) => s.rollNo === rollNo)?.studentName || "N/A"
              : "N/A",
          rollNo,
          className: classNameMap[rollNo] || "unknown", // Include className
          tutorial,
          assignment,
          ca1,
          ca2,
          caTotal,
          total: (parseFloat(tutorial) + assignment + parseFloat(caTotal)).toFixed(2),
        };
      });

      console.log("Students Data:", JSON.stringify(studentsData.slice(0, 3), null, 2));

      setStudents(studentsData);
      saveTotalMarks(studentsData, selectedCourseId);
    } catch (error) {
      console.error("❌ Error fetching marks:", error);
      setError("Failed to fetch marks data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save Total Marks to Backend
  const saveTotalMarks = async (studentsData, courseId) => {
    try {
      await axios.post("http://localhost:5000/api/overall-marks/save", {
        students: studentsData,
        courseId,
      });
      console.log("✅ Total marks saved successfully!");
    } catch (error) {
      console.error("❌ Error saving total marks:", error);
    }
  };

  return (
    <div className="internals-container">
      <h2>Overall Internals Result</h2>

      {/* ✅ Course Selection Dropdown */}
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

      {/* ✅ Class Selection Dropdown */}
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

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : students.length > 0 ? (
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
      ) : (
        <p>No data available for the selected course and class: {selectedClass.toUpperCase()}.</p>
      )}
    </div>
  );
};

export default OverallInternals;