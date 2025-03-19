import React from "react";
import "../css/CourseMenu.css"; 
import { Link } from "react-router-dom";


const Analyse = () => {
  return (
    <div className="analyse-container">
      <h2 className="analyse-title">Analysis Dashboard</h2>

      <div className="analyse-actions">
        <h3>Choose an Analysis Option</h3>

        <div className="action-buttons">
          <Link to="/OverallInternals" className="action-btn">
            <img src="/images/internals.png" alt="Overall Internals" className="action-icon" />
            <span>Overall Internals Result</span>
          </Link>

          <Link to="/Performance" className="action-btn">
            <img src="/images/performance.png" alt="Student Performance" className="action-icon" />
            <span>Student Performance</span>
          </Link>

          <Link to="/individual-report" className="action-btn">
            <img src="/images/report.png" alt="Individual Report" className="action-icon" />
            <span>View Individual Student Report</span>
          </Link>

          <Link to="/send-mail" className="action-btn">
            <img src="/images/mail.png" alt="Send Mail" className="action-icon" />
            <span>Send Mail</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Analyse;
