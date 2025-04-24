import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/constactus.css";

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="contact-us-container">
      <h1>Contact Us</h1>
      <section className="contact-us-section">
        <p>
          For technical support or inquiries about the Faculty Portal (APAS), please reach out to our IT support team or the Faculty Portal administrator.
        </p>
        <h2>Contact Information</h2>
        <p>
          <strong>Email</strong>: it.support@your-institution.edu<br />
          <strong>Phone</strong>: +91-123-456-7890<br />
          <strong>Office</strong>: IT Support Office, Academic Block, Your Institution
        </p>
        <h2>Support Hours</h2>
        <p>
          Monday to Friday: 9:00 AM - 5:00 PM<br />
          Saturday: 10:00 AM - 2:00 PM
        </p>
      </section>
      <div className="action-buttons">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ContactUs;