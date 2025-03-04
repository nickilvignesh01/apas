import { auth } from "../firebase";

export const fetchWithAuth = async (url, options = {}) => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("❌ No authenticated user found.");
    return;
  }
  
  const token = await user.getIdToken(true); // Force refresh token
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};
