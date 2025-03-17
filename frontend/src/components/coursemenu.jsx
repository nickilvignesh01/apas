    import React, { useEffect, useState } from "react";
    import { useParams, Link } from "react-router-dom";
    import axios from "axios";
    import "../css/CourseMenu.css"; // Import the CSS file for styling

    const CourseMenu = () => {
    const { courseId } = useParams(); // Get the courseId from the URL parameter
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch course details on page load or courseId change
    useEffect(() => {
        axios
        .get(`http://localhost:5000/api/course/${courseId}`) // Use the courseId in the URL to fetch course details
        .then((response) => {
            setCourse(response.data); // Set the course details into the state
            setLoading(false);
        })
        .catch((error) => {
            console.error("Error fetching course details:", error);
            setError("Failed to fetch course details.");
            setLoading(false);
        });
    }, [courseId]); // Re-fetch the course when the courseId changes

    if (loading) return <div className="loading">Loading course details...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="course-menu-container">
        <h2 className="course-title">{course?.courseName}</h2> {/* Show course name */}
        <p className="course-description">{course?.description}</p> {/* Show course description */}
        <p><strong>Course Type:</strong> {course?.courseType}</p>
        <p><strong>Number of Students:</strong> {course?.numOfStudents}</p>
        <p><strong>Duration:</strong> {course?.duration}</p>
        <p><strong>Course Code:</strong> {course?.courseCode}</p>

        {/* Display start and end date */}
        <p><strong>Start Date:</strong> {new Date(course?.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> {new Date(course?.endDate).toLocaleDateString()}</p>

        <div className="syllabus-download">
            {/* Assuming syllabus is a file path stored in the database */}
            <a href={`http://localhost:5000/${course?.syllabus}`} target="_blank" rel="noopener noreferrer">
            <button className="btn">Download Syllabus</button>
            </a>
        </div>

        <div className="course-actions">
            <h3>What would you like to do?</h3>

            <div className="action-buttons">
            <Link to={`/tutorials/${courseId}`} className="action-btn">
                <img src="/images/tut.png" alt="Tutorials" className="action-icon" />
                <span>Tutorial</span>
            </Link>

            
       <Link to={`/assignment-marks/${courseId}`} className="action-btn">
  <img src="/images/assign.png" alt="Assignments" className="action-icon" />
  <span>Assignments</span>
</Link>


            <Link to={`/reports/${courseId}`} className="action-btn">
                <img src="/images/rep.png" alt="Reports" className="action-icon" />
                <span>Reports</span>
            </Link>

            <Link to={`/consolidate/${courseId}`} className="action-btn">
                <img src="/images/cons.png" alt="Consolidate" className="action-icon" />
                <span>Consolidate</span>
            </Link>
            </div>
        </div>
        </div>
    );
    };

    export default CourseMenu;
