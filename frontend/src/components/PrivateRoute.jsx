import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase"; // Import Firebase auth
import { useAuthState } from "react-firebase-hooks/auth"; 

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth); // Get current user state
  
  if (loading) return <p>Loading...</p>; // Show loading while checking auth status
  
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
