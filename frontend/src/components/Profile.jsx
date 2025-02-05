import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, updateUserProfile } from "../firebase";
import "../css/Profile.css"; // Import the CSS file

const Profile = () => {
  const [user] = useAuthState(auth);

  // Ensure profile picture is available for email/password users
  useEffect(() => {
    if (user) {
      console.log("User Data:", user);
      console.log("Profile Picture URL:", user?.photoURL);
      updateUserProfile(user);
    }
  }, [user]);

  return (
    <div className="profile-container">
      <h2 className="profile-title">Profile</h2>
      <div className="profile-card">
        <div className="profile-info">
          {/* Profile Picture */}
          <div className="profile-pic-container">
            <img
              className="profile-pic"
              src={user?.photoURL || "https://via.placeholder.com/150"}
              alt="Profile"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = "https://via.placeholder.com/150"; // Use default if broken
              }}
            />
          </div>

          {/* Profile Details */}
          <p className="profile-detail">
            <span className="profile-label">Name:</span>
            <span className="profile-value">{user?.displayName || "N/A"}</span>
          </p>
          <p className="profile-detail">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user?.email || "N/A"}</span>
          </p>
          <p className="profile-detail">
            <span className="profile-label">UID:</span>
            <span className="profile-value">{user?.uid || "N/A"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
