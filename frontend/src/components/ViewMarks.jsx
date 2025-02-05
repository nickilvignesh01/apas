import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/ViewMarks.css";

const ViewMarks = () => {
  const { courseId, className, tutorialId } = useParams();
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    fetchMarks();
  }, [courseId, className, tutorialId]);

  const fetchMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      const tutorialMarks = res.data.filter((mark) => mark.tutorialId === tutorialId);
      setMarks(tutorialMarks);
    } catch (error) {
      console.error("Error fetching marks:", error);
    }
  };

  return (
    <div className="view-marks-container">
      <h2>Marks for Tutorial {tutorialId}</h2>
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Marks</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((mark) => (
            <tr key={mark.rollNo}>
              <td>{mark.rollNo}</td>
              <td>{mark.marks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewMarks;
