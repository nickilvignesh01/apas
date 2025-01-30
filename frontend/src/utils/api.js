import { auth } from "../firebase";

export const fetchWithAuth = async (url, options = {}) => {
  const token = await auth.currentUser.getIdToken(); // Get Firebase token

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};
