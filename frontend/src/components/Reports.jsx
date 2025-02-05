import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/Reports.css"; // Assuming this is your styling file

const Reports = () => {
  const { courseId } = useParams();
  const [marksData, setMarksData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, [courseId]);

  // Fetch course name and marks for the course
  const fetchMarks = async () => {
    try {
      // Fetch marks data for the course
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      setMarksData(res.data);

      // Fetch course name using the courseId (modify the API call as needed)
      const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      setCourseName(courseRes.data.courseName);
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group marks by tutorialId
  const groupMarksByTutorial = () => {
    return marksData.reduce((groups, mark) => {
      const { tutorialId } = mark;
      if (!groups[tutorialId]) {
        groups[tutorialId] = [];
      }
      groups[tutorialId].push(mark);
      return groups;
    }, {});
  };

  const groupedMarks = groupMarksByTutorial();

  return (
    <div className="reports-container">
      <h2>Reports card</h2>

      {loading ? (
        <p>Loading marks...</p>
      ) : (
        <>
          {Object.keys(groupedMarks).length > 0 ? (
            Object.keys(groupedMarks).map((tutorialId) => (
              <div key={tutorialId} className="tutorial-group">
                <h3>Tutorial {tutorialId}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Marks</th>
                      <th>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedMarks[tutorialId].map((mark, index) => (
                      <tr key={index}>
                        <td>{mark.studentName}</td>
                        <td>{mark.marks}</td>
                        <td>{mark.maxMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>No marks available for this course.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
