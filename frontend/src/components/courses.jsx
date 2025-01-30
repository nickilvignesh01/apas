import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../css/Courses.css";  // Import the CSS file

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/course") // Corrected URL to /api/course
      .then((response) => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError("Failed to fetch courses.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading courses...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h2 className="title">Manage Courses</h2>
      <p className="description">Manage your courses efficiently and keep track of all academic details.</p>

      <div className="courses-list">
        <h3>Your Courses:</h3>
        <ul className="courses">
          {courses.length > 0 ? (
            courses.map((course) => (
              <li key={course._id} className="course-item">
                <Link to={`/course-menu/${course._id}`} className="course-link">{course.courseName}</Link>
              </li>
            ))
          ) : (
            <p>No courses added yet. Click "Add New Course" to get started.</p>
          )}
        </ul>
      </div>

      <div className="add-course-btn">
        <Link to="/add-course" className="btn">Add New Course</Link>
      </div>
    </div>
  );
};

export default Courses;
