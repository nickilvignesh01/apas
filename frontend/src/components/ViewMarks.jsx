import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/ViewMarks.css";

const ViewMarks = () => {
  const { courseId, tutorialId } = useParams();
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    fetchMarks();
  }, [courseId, tutorialId]);

  const fetchMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}/${tutorialId}`);
      setMarks(res.data);
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
            <th>Student Name</th>
            <th>Marks</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((mark) => (
            <tr key={`${mark.rollNo}-${tutorialId}`}> 
              <td>{mark.rollNo}</td>
              <td>{mark.studentName}</td>
              <td>{mark.marks} / {mark.maxMarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewMarks;
