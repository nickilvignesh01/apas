import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const CourseMenu = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/courses/${courseId}`)
      .then((response) => setCourse(response.data))
      .catch((error) => console.error("Error fetching course:", error));
  }, [courseId]);

  if (!course) return <p>Loading course details...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">{course.courseName}</h2>
      <p><strong>Type:</strong> {course.courseType}</p>
      <p><strong>Number of Students:</strong> {course.numOfStudents}</p>
      <p><strong>Duration:</strong> {course.duration}</p>
      <p><strong>Course Code:</strong> {course.courseCode}</p>
    </div>
  );
};

export default CourseMenu;
