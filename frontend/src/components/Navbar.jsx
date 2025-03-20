import React, { useState } from "react";
import { FaUserCircle, FaQuestionCircle, FaCommentDots, FaPhoneAlt, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import '../css/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo-container">
        <img src="/images/logo.png" alt="Logo" className="logo-img" />
        <div className="logo-text">APAS</div>
      </div>

      {/* Navigation Links */}
      <ul className="nav-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        <li><Link to="/assessments"> assessments </Link></li>
        <li><Link to="/analyse">analyse</Link></li>
        <li><Link to="/help">Help</Link></li>
      </ul>

      {/* User Icon */}
      <div className="user-icon" onClick={() => setIsOpen(!isOpen)}>
        <FaUserCircle className="user-img" />
        {isOpen && (
          <div className="dropdown">
            <Link to="/profile">
              <FaUserCircle className="dropdown-icon" />
              Profile
            </Link>
            <Link to="/help">
              <FaQuestionCircle className="dropdown-icon" />
              Help
            </Link>
            <Link to="/feedback">
              <FaCommentDots className="dropdown-icon" />
              Feedback
            </Link>
            <Link to="/contact-us">
              <FaPhoneAlt className="dropdown-icon" />
              Contact Us
            </Link>
            <button onClick={handleLogout}>
              <FaSignOutAlt className="dropdown-icon" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
