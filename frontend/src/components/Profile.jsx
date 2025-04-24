import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, updateUserProfile } from "../firebase";
import { signOut, updateProfile, updateEmail } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/Profile.css";

const Profile = () => {
  const [user, loading, error] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      console.log("User Data:", user);
      console.log("Profile Picture URL:", user?.photoURL);
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      updateUserProfile(user); // Ensure profile consistency
    }
  }, [user]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      // Validate inputs
      if (!displayName.trim()) {
        toast.error("Name cannot be empty");
        setIsUpdating(false);
        return;
      }
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        toast.error("Invalid email format");
        setIsUpdating(false);
        return;
      }

      // Update Firebase profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoFile ? URL.createObjectURL(photoFile) : user.photoURL,
      });

      // Update email if changed
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setPhotoFile(null);
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(`Failed to update profile: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error(`Logout failed: ${err.message}`);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return timestamp ? new Date(timestamp).toLocaleString() : "N/A";
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  if (error) {
    return <div className="profile-container">Error: {error.message}</div>;
  }

  if (!user) {
    return <div className="profile-container">Please sign in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="profile-title">Faculty Profile</h2>
      <div className="profile-card">
        {/* Profile Picture and Edit Toggle */}
        <div className="profile-header">
          <div className="profile-pic-container">
            <img
              className="profile-pic"
              src={
                photoFile
                  ? URL.createObjectURL(photoFile)
                  : user.photoURL || "https://via.placeholder.com/150"
              }
              alt="Profile"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
          </div>
          <button
            className="profile-action-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Profile Form or Details */}
        {isEditing ? (
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="profile-form-group">
              <label className="profile-label">Name:</label>
              <input
                type="text"
                className="profile-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-label">Email:</label>
              <input
                type="email"
                className="profile-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-label">Profile Picture:</label>
              <input
                type="file"
                accept="image/*"
                className="profile-input"
                onChange={(e) => setPhotoFile(e.target.files[0])}
              />
            </div>
            <button
              type="submit"
              className="profile-submit-btn"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="profile-info">
            <p className="profile-detail">
              <span className="profile-label">Name:</span>
              <span className="profile-value">{user.displayName || "N/A"}</span>
            </p>
            <p className="profile-detail">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user.email || "N/A"}</span>
            </p>
            <p className="profile-detail">
              <span className="profile-label">UID:</span>
              <span className="profile-value">{user.uid || "N/A"}</span>
            </p>
            <p className="profile-detail">
              <span className="profile-label">Account Created:</span>
              <span className="profile-value">
                {formatDate(user.metadata.creationTime)}
              </span>
            </p>
            <p className="profile-detail">
              <span className="profile-label">Last Login:</span>
              <span className="profile-value">
                {formatDate(user.metadata.lastSignInTime)}
              </span>
            </p>
          </div>
        )}

        {/* Account Actions */}
        <div className="profile-actions">
          <button className="profile-action-btn logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;