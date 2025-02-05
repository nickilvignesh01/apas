import React, { useState } from "react";
import axios from "axios";

const Reports = ({ courseId }) => {
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch marks for the course
  const fetchMarks = async () => {
    if (!courseId) {
      console.error("Error: courseId is undefined!");
      return;
    }

    setLoading(true); // Set loading to true when starting the fetch

    try {
      const response = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      setMarksData(response.data);  // Save marks data received from API
    } catch (error) {
      console.error("Error fetching marks:", error.response ? error.response.data : error.message);
    }

    setLoading(false); // Set loading to false once data is fetched
  };

  return (
    <div>
      <h2>Reports</h2>

      {/* Button to fetch tutorial marks */}
      <button onClick={fetchMarks} disabled={loading}>
        {loading ? "Loading..." : "View Tutorial Marks"}
      </button>

      {/* Display tutorial marks if available */}
      {marksData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Tutorial ID</th>
              <th>Student Name</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {marksData.map((mark, index) => (
              <tr key={index}>
                <td>{mark.tutorialId}</td>
                <td>{mark.studentName || "N/A"}</td> {/* Assuming backend sends studentName */}
                <td>{mark.marks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Display message when no data is available */}
      {marksData.length === 0 && !loading && <p>No marks available for this course.</p>}
    </div>
  );
};

export default Reports;
