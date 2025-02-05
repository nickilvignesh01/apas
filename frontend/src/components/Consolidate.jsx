import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/Reports.css"; // Assuming this is your styling file

const Consolidate = () => {
  const { courseId } = useParams();
  const [marksData, setMarksData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [assignmentMarks, setAssignmentMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculationOption, setCalculationOption] = useState("average"); // 'average' or 'best'

  useEffect(() => {
    fetchMarks();
  }, [courseId]);

  // Fetch course name, tutorial marks, and assignment marks for the course
  const fetchMarks = async () => {
    try {
      // Fetch tutorial marks data for the course
      const marksRes = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      setMarksData(marksRes.data);

      // Fetch assignment marks using the courseId (ensure this endpoint exists in your backend)
      const assignmentRes = await axios.get(`http://localhost:5000/api/assignments/${courseId}`);
      setAssignmentMarks(assignmentRes.data);

      // Fetch course name
      const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      setCourseName(courseRes.data.courseName);
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group marks by studentId
  const groupMarksByStudent = () => {
    const studentMarks = marksData.reduce((groups, mark) => {
      const { studentName, rollNo, tutorialId, marks, maxMarks } = mark;

      // Initialize the student if they don't already exist in the groups
      if (!groups[rollNo]) {
        groups[rollNo] = {
          studentName,
          rollNo,
          tutorialMarks: {},
          assignmentMarks: 0, // Default to 0 if no assignment marks
        };
      }

      // Add tutorial marks for each tutorialId
      groups[rollNo].tutorialMarks[tutorialId] = { marks, maxMarks };

      return groups;
    }, {});

    // Adding assignment marks to the student data
    assignmentMarks.forEach((assignment) => {
      const { studentId, marks } = assignment;
      if (studentMarks[studentId]) {
        studentMarks[studentId].assignmentMarks = marks;
      } else {
        studentMarks[studentId] = {
          studentName: "Unknown", // If student not found, assign "Unknown"
          rollNo: studentId,
          tutorialMarks: {}, // Ensure an empty object if no tutorial marks
          assignmentMarks: marks,
        };
      }
    });

    return studentMarks;
  };

  // Function to calculate total marks based on selected option (average/best)
  const calculateTotalMarks = (tutorialMarks) => {
    const marksArray = Object.values(tutorialMarks).map((t) => t.marks);
    if (calculationOption === "best") {
      return Math.max(...marksArray);
    } else if (calculationOption === "average") {
      return marksArray.reduce((acc, mark) => acc + mark, 0) / marksArray.length;
    }
    return 0;
  };

  // Get assignment marks for a specific student
  const getAssignmentMarksForStudent = (studentId) => {
    const assignment = assignmentMarks.find((a) => a.studentId === studentId);
    return assignment ? assignment.marks : 0;
  };

  const groupedMarks = groupMarksByStudent();

  return (
    <div className="reports-container">
      <h2>Consolidated Report: {courseName}</h2>

      {/* Option to select calculation method */}
      <div>
        <label>
          <input
            type="radio"
            value="average"
            checked={calculationOption === "average"}
            onChange={() => setCalculationOption("average")}
          />
          Average of all marks
        </label>
        <label>
          <input
            type="radio"
            value="best"
            checked={calculationOption === "best"}
            onChange={() => setCalculationOption("best")}
          />
          Best of all marks
        </label>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          {Object.keys(groupedMarks).length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  {Object.keys(groupedMarks[Object.keys(groupedMarks)[0]].tutorialMarks).map((tutorialId) => (
                    <th key={tutorialId}>Tutorial {tutorialId}</th>
                  ))}
                  <th>Assignment Marks</th>
                  <th>Total Marks</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedMarks).map((studentId) => {
                  const student = groupedMarks[studentId];
                  const totalMarks = calculateTotalMarks(student.tutorialMarks);
                  const assignmentMarksForStudent = student.assignmentMarks;

                  return (
                    <tr key={studentId}>
                      <td>{student.studentName}</td>
                      <td>{student.rollNo}</td>
                      {Object.keys(student.tutorialMarks).map((tutorialId) => {
                        const { marks, maxMarks } = student.tutorialMarks[tutorialId];
                        return (
                          <td key={tutorialId}>
                            {marks || "Not Available"} / {maxMarks || "Not Available"}
                          </td>
                        );
                      })}
                      <td>{assignmentMarksForStudent || "Not Available"}</td>
                      <td>{totalMarks || "Not Available"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No data available for this course.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Consolidate;
