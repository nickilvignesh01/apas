import React, { useState } from "react";
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="image-container">
        <h1 className="app-title">A P A S</h1>
        <h3 className="app-subtitle">"Academic Performance Analysis System"</h3>
        <img src="/images/login.png" alt="Login" className="login-image" />
      </div>
      <div className="login-content">
        <h1 className="welcome-text">Welcome Back!</h1>

        {/* Google Login Button (Moved to the top) */}
        <div className="google-login">
          <button onClick={handleGoogleLogin} className="google-btn">
            <AiFillGoogleCircle size={30} className="google-icon" />
            Continue with Google
          </button>
        </div>

        {/* OR Divider */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Email/Password Login */}
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
      </div>
    </div>
  );
};

export default Login;
