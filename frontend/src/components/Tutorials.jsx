import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../css/Tutorials.css";

const Tutorials = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [numTutorials, setNumTutorials] = useState(0);
  const [maxMarks, setMaxMarks] = useState({});
  const [tutorials, setTutorials] = useState([]);
  const [completedTutorials, setCompletedTutorials] = useState([]);
  const [savedMarks, setSavedMarks] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    fetchClasses();
    fetchCompletedTutorials();
    fetchSavedMarks();
    loadSavedData();
  }, [courseId]);

  // Load saved data from localStorage
  const loadSavedData = () => {
    const savedNumTutorials = localStorage.getItem(`numTutorials_${courseId}`);
    const savedMaxMarks = localStorage.getItem(`maxMarks_${courseId}`);

    if (savedNumTutorials) {
      setNumTutorials(parseInt(savedNumTutorials, 10));
      setIsSaved(true);
    }

    if (savedMaxMarks) {
      setMaxMarks(JSON.parse(savedMaxMarks));
    }
  };

  // Save tutorial data to localStorage
  const saveTutorialData = () => {
    localStorage.setItem(`numTutorials_${courseId}`, numTutorials);
    localStorage.setItem(`maxMarks_${courseId}`, JSON.stringify(maxMarks));
    setIsSaved(true);
  };

  // Fetch Course Details
  const fetchCourseDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/course/${courseId}`);
      setCourse(res.data);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  // Fetch Available Classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/classes");
      setClasses(res.data);
      if (res.data.length > 0) {
        setSelectedClass(res.data[0].name);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch Completed Tutorials
  const fetchCompletedTutorials = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/completed/${courseId}`);
      if (res.data.length === 0) {
        setCompletedTutorials([]); // Reset if data is deleted
      } else {
        setCompletedTutorials(res.data);
      }
    } catch (error) {
      console.error("Error fetching completed tutorials:", error);
    }
  };

  // Fetch Saved Marks
  const fetchSavedMarks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutorial-marks/${courseId}`);
      if (res.data.length === 0) {
        setSavedMarks({}); // Reset if no marks found in MongoDB
        localStorage.removeItem(`numTutorials_${courseId}`); // Clear localStorage if no data
        localStorage.removeItem(`maxMarks_${courseId}`);
      } else {
        const marksData = {};
        res.data.forEach((entry) => {
          marksData[entry.tutorialId] = entry.marks;
        });
        setSavedMarks(marksData);
      }
    } catch (error) {
      console.error("Error fetching saved marks:", error);
    }
  };

  // Generate Tutorials when number of tutorials is saved
  useEffect(() => {
    if (isSaved) {
      const newTutorials = Array.from({ length: numTutorials }, (_, index) => ({
        tutorialId: index + 1,
        maxMarks: maxMarks[index + 1] || 100,
      }));
      setTutorials(newTutorials);
    }
  }, [isSaved, numTutorials, maxMarks]);

  // Add More Tutorials
  const addMoreTutorials = () => {
    setNumTutorials((prev) => prev + 1);
    localStorage.setItem(`numTutorials_${courseId}`, numTutorials + 1);
  };

  return (
    <div className="tutorials-container">
      <h2>Manage Tutorials for {course?.courseName}</h2>

      {/* Select Class */}
      <label>Select Class:</label>
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        {classes.map((cls) => (
          <option key={cls._id} value={cls.name}>
            {cls.name}
          </option>
        ))}
      </select>

      {/* Enter Number of Tutorials (Only if not saved) */}
      {!isSaved && (
        <div className="tutorial-input">
          <input
            type="number"
            placeholder="Enter number of tutorials"
            value={numTutorials}
            onChange={(e) => setNumTutorials(Number(e.target.value))}
            min="1"
          />
          <button onClick={saveTutorialData}>Save</button>
        </div>
      )}

      {/* Enter Max Marks for Each Tutorial (Only if not saved) */}
      {!isSaved &&
        numTutorials > 0 &&
        Array.from({ length: numTutorials }, (_, index) => index + 1).map((num) => (
          <div key={num} className="tutorial-max-marks">
            <label>Max Marks for Tutorial {num}:</label>
            <input
              type="number"
              value={maxMarks[num] || ""}
              onChange={(e) => setMaxMarks({ ...maxMarks, [num]: Number(e.target.value) })}
              min="1"
            />
          </div>
        ))}

      {/* Add More Tutorials Button */}
      {isSaved && (
        <button className="add-tutorial-btn" onClick={addMoreTutorials}>
          Add More Tutorials
        </button>
      )}

      {/* Tutorial Buttons */}
      {isSaved && tutorials.length > 0 && (
        <div className="tutorial-buttons">
          {tutorials.map((tut) => {
            const isCompleted = completedTutorials.includes(tut.tutorialId);
            const savedMark = savedMarks[tut.tutorialId];

            return (
              <div key={tut.tutorialId}>
                {isCompleted || savedMark ? (
                  <div>
                    <Link
                      to={`/view-marks/${courseId}/${selectedClass}/${tut.tutorialId}`}
                      className="view-marks-btn"
                    >
                      View Tutorial {tut.tutorialId} Marks
                    </Link>
                    <Link
                      to={`/mark-entry/${courseId}/${selectedClass}/${tut.tutorialId}/${tut.maxMarks}`}
                      className="edit-marks-btn"
                    >
                      Edit Marks
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/mark-entry/${courseId}/${selectedClass}/${tut.tutorialId}/${tut.maxMarks}`}
                    className="tutorial-btn"
                  >
                    Enter Marks for Tutorial {tut.tutorialId}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tutorials;
