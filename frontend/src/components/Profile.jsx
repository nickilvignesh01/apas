import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import "../css/Profile.css"; // Import the CSS file

const Profile = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="profile-container">
      <h2 className="profile-title">Profile</h2>
      <div className="profile-card">
        <div className="profile-info">
          <p className="profile-detail">
            <span className="profile-label">Name:</span>
            <span className="profile-value">{user ? user.displayName : "N/A"}</span>
          </p>
          <p className="profile-detail">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user ? user.email : "N/A"}</span>
          </p>
          <p className="profile-detail">
            <span className="profile-label">UID:</span>
            <span className="profile-value">{user ? user.uid : "N/A"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;