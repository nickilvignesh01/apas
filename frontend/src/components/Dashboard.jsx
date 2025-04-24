import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";
import { auth } from "../firebase";
import 'animate.css';
import "../css/Dashboard.css";

const Dashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [courses, setCourses] = useState([]);
  const [studentsAtRisk, setStudentsAtRisk] = useState(0);
  const [quote, setQuote] = useState("Empower your students with knowledge and innovation!");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses and low-performing students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch courses
        const coursesRes = await axios.get("http://localhost:5000/api/course");
        const fetchedCourses = coursesRes.data;
        setCourses(fetchedCourses);

        // Fetch students at risk
        let totalAtRisk = 0;
        for (const course of fetchedCourses) {
          const marksRes = await axios.get(`http://localhost:5000/api/overall-marks/${course._id}`);
          const lowPerformers = marksRes.data.filter(
            (mark) => ((mark.total / 50) * 40) < 18
          );
          totalAtRisk += lowPerformers.length;
        }
        setStudentsAtRisk(totalAtRisk);

        // Random motivational quote
        const quotes = [
          "Empower your students with knowledge and innovation!",
          "Shape the future, one lesson at a time.",
          "Inspire, educate, and transform lives!",
          "Every student’s success is your legacy."
        ];
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply animations
  useEffect(() => {
    const elements = document.querySelectorAll('.dashboard-card, .dashboard-link, .dashboard-profile, .dashboard-stats, .dashboard-quote');
    elements.forEach((el, index) => {
      el.classList.add('animate__animated', 'animate__fadeInUp');
      el.style.animationDelay = `${index * 0.2}s`;
    });
  }, []);

  if (loading || isLoading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div
      className="dashboard-container"
      style={{
        background: `url(/images/bgimage.jpg) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div className="dashboard-card animate__animated animate__fadeInUp">
        <h1 className="dashboard-title animate__animated animate__bounceInDown">
          Welcome, {user ? user.displayName : "Faculty"}!
        </h1>
        <p className="dashboard-subtitle animate__animated animate__fadeIn">
          Enhancing Academic Productivity Through Innovation
        </p>

        {/* Navigation Links - Main Attraction */}
        <div className="dashboard-grid">
          {[
            { name: "courses", icon: "/images/courses.png", label: "Courses" },
            { name: "assessments", icon: "/images/assess.png", label: "Assessments" },
            { name: "analyse", icon: "/images/report.png", label: "Analyse" },
            { name: "profile", icon: "/images/profile.png", label: "Profile" },
            { name: "MyClass", icon: "/images/help.png", label: "My Class" },
          ].map((item, index) => (
            <Link
              to={`/${item.name}`}
              key={index}
              className="dashboard-link animate__animated animate__fadeInUp"
            >
              <img
                src={item.icon}
                alt={item.label}
                className="dashboard-icon"
              />
              <span className="dashboard-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Profile Snapshot */}
        <div className="dashboard-profile animate__animated animate__fadeInUp">
          <h2 className="profile-title">Your Profile</h2>
          <div className="profile-content">
            <img
              className="profile-pic"
              src={user?.photoURL || "https://via.placeholder.com/100"}
              alt="Profile"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/100";
              }}
            />
            <div className="profile-details">
              <p><strong>Name:</strong> {user?.displayName || "N/A"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Last Login:</strong> {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "N/A"}</p>
              <Link to="/profile" className="profile-edit-btn">Edit Profile</Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats animate__animated animate__fadeInUp">
          <h2 className="stats-title">Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <img src="/images/courses.png" alt="Courses" className="stat-icon" />
              <h3>{courses.length}</h3>
              <p>Courses Managed</p>
            </div>
            <div className="stat-card">
              <img src="/images/report.png" alt="Students" className="stat-icon" />
              <h3>{studentsAtRisk}</h3>
              <p>Students at Risk</p>
            </div>
            <div className="stat-card">
              <img src="/images/assess.png" alt="Assessments" className="stat-icon" />
              <h3>0</h3>
              <p>Pending Assessments</p>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="dashboard-quote animate__animated animate__fadeInUp">
          <p>"{quote}"</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;