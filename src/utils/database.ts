
// Utility to handle database connections and operations
import axios from "axios";

// Base URL for API calls
const API_BASE_URL = "/api";

// Types
export type DBUser = {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
};

// User authentication functions
export const authenticateUser = async (username: string, password: string): Promise<DBUser | null> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login.php`, {
      username,
      password
    });
    
    if (response.data.success) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};

export const getUserById = async (userId: string): Promise<DBUser | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user.php?id=${userId}`);
    
    if (response.data.success) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
};
