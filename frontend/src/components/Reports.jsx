import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/Reports.css"; // Assuming this is your styling file

const Reports = () => {
  const { courseId } = useParams();
  const [marksData, setMarksData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // Fetch course name, classes, and marks for the course
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch marks, course, and classes concurrently
      const [marksRes, courseRes, classesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/tutorial-marks/${courseId}`),
        axios.get(`${process.env.REACT_APP_API}/api/course/${courseId}`), // Adjusted to match your API
        axios.get(`${process.env.REACT_APP_API}/api/classes`),
      ]);

      console.log("Tutorial Marks Response (Sample):", JSON.stringify(marksRes.data.slice(0, 3), null, 2));
      console.log("Classes Response:", JSON.stringify(classesRes.data, null, 2));
      console.log("Course Response:", courseRes.data);

      setMarksData(marksRes.data);
      setCourseName(courseRes.data.courseName || "Unknown Course");
      setAvailableClasses(classesRes.data.map((cls) => cls.name.toLowerCase()));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Group marks by tutorialId, filtered by selected class
  const groupMarksByTutorial = () => {
    console.log("Marks Data Sample:", JSON.stringify(marksData.slice(0, 3), null, 2));
    console.log("Selected Class:", selectedClass);

    if (!marksData || marksData.length === 0) {
      console.warn("No marks data available.");
      return {};
    }

    const selected = selectedClass.trim().toLowerCase();

    // Filter marks by className
    const filtered =
      selected === "all"
        ? marksData
        : marksData.filter((entry) => {
            const entryClass = entry.className?.trim().toLowerCase() || "unknown";
            console.log("Comparing:", entryClass, selected);
            return entryClass === selected;
          });

    if (filtered.length === 0) {
      console.warn("No data matched for selected class:", selectedClass);
      return {};
    }

    // Group filtered marks by tutorialId
    return filtered.reduce((groups, mark) => {
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
      <h2>Reports Card: {courseName || "Loading..."}</h2>

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
        <p>Loading data...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : Object.keys(groupedMarks).length > 0 ? (
        <>
          {Object.keys(groupedMarks).map((tutorialId) => (
            <div key={tutorialId} className="tutorial-group">
              <h3>Tutorial {tutorialId}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Marks</th>
                    <th>Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedMarks[tutorialId].map((mark, index) => (
                    <tr key={index}>
                      <td>{mark.studentName || mark.rollNo}</td>
                      <td>{mark.rollNo}</td>
                      <td>{mark.marks ?? "N/A"}</td>
                      <td>{mark.maxMarks ?? "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      ) : (
        <p>No marks available for the selected class: {selectedClass.toUpperCase()}.</p>
      )}
    </div>
  );
};

export default Reports;