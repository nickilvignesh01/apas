import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import 'animate.css'; // Import animate.css
import "../css/Dashboard.css";

const Dashboard = () => {
  const [user] = useAuthState(auth);

  useEffect(() => {
    // Adding a delay for the animations to give a cascading effect
    const elements = document.querySelectorAll('.dashboard-card, .dashboard-link, .dashboard-overview');
    elements.forEach((el, index) => {
      el.classList.add('animate__animated', 'animate__fadeInUp');
      el.style.animationDelay = `${index * 0.2}s`;
    });
  }, []);

  return (
    <>
      {/* Dashboard */}
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
            Enhancing Academic Productivity Through Innovation!
          </p>

          <div className="dashboard-grid">
            {[
              { name: "courses", icon: "/images/courses.png" },
              { name: "assessments", icon: "/images/assess.png" },
              { name: "reports", icon: "/images/report.png" },
              { name: "profile", icon: "/images/profile.png" },
              { name: "MyClass", icon: "/images/help.png" },
            ].map((item, index) => (
              <Link
                to={`/${item.name}`}
                key={index}
                className="dashboard-link animate__animated animate__fadeInUp"
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="dashboard-icon"
                />
                <span className="dashboard-text">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="dashboard-overview animate__animated animate__fadeInUp">
            <h2 className="overview-title">Dashboard Overview</h2>
            <p>
              <strong>Total Courses Managed:</strong> 0
            </p>
            <p>
              <strong>Pending Assessments:</strong> 0
            </p>
            <p>
              <strong>Students at Risk:</strong> 0
            </p>
            <p>
              <strong>Courses Added:</strong> No courses added
            </p>
            <p>
              <strong>Tutorials/Assignments Pending Mark Entry:</strong> Yes
            </p>
            <p>
              <strong>Students Below Threshold:</strong> 0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
