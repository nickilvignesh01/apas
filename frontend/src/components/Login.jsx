import React, { useState } from "react";
import { motion } from "framer-motion";
import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { AiFillGoogleCircle } from "react-icons/ai";
import "../css/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email) => email.endsWith("@psgtech.ac.in");

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!isValidEmail(user.email)) {
        setError("Only @psgtech.ac.in email addresses are allowed.");
        await auth.signOut();
        return;
      }

      // Get the Firebase ID token and store it
      const token = await user.getIdToken();
      localStorage.setItem("token", token); // Store token in localStorage

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Only @psgtech.ac.in email addresses are allowed.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get the Firebase ID token and store it
      const token = await user.getIdToken();
      localStorage.setItem("token", token); // Store token in localStorage

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="app-logo"
        initial={{ opacity: 0, scale: 2 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [3, 2.5, 2.5, 2] }}
        transition={{ duration: 2, times: [0, 0.25, 0.75, 1] }}
        style={{ position: "absolute", top: "40%", left: "45%", transform: "translate(-50%, -50%)" }}
      >
        <img src="/images/logo.png" alt="APAS Logo" style={{ width: "200px", height: "auto" }} />
      </motion.div>

      <motion.div
        className="image-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <h3 className="app-subtitle">"Academic Performance Analysis System"</h3>
        <img src="/images/login.png" alt="Login" className="login-image" />
      </motion.div>

      <motion.div
        className="login-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      >
        <h1 className="welcome-text">APAS</h1>
        <h2 className="welcome-text">Welcome Back!</h2>
        <div className="google-login">
          <button onClick={handleGoogleLogin} className="google-btn">
            <AiFillGoogleCircle size={30} className="google-icon" />
            Continue with Google
          </button>
        </div>
        <div className="divider">
          <span>OR</span>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
