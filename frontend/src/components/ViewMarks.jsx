import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/ViewMarks.css";

const ViewMarks = () => {
  const { courseId, tutorialId } = useParams();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, [courseId, tutorialId]);

  // Function to fetch marks from the server
  const fetchMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}/${tutorialId}`);

      // Filter to keep only the latest marks for each student
      const latestMarks = Object.values(
        res.data.reduce((acc, mark) => {
          acc[mark.rollNo] = mark; // Keep only the last occurrence of each rollNo
          return acc;
        }, {})
      );

      setMarks(latestMarks);
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-marks-container">
      <h2>Marks for Tutorial {tutorialId}</h2>

      {loading ? (
        <p>Loading marks...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {marks.length > 0 ? (
              marks.map((mark) => (
                <tr key={mark.rollNo}> {/* Unique key based on roll number */}
                  <td>{mark.rollNo}</td>
                  <td>{mark.studentName}</td>
                  <td>{mark.marks} / {mark.maxMarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No marks found for this tutorial.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewMarks;
