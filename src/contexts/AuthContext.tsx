
import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  username: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for stored user on initial load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // Clear invalid stored data
        localStorage.removeItem("user");
      }
    } else {
      // Also check sessionStorage as a fallback
      const sessionAuth = sessionStorage.getItem("admin_authenticated");
      if (sessionAuth === "true") {
        // Try to re-authenticate session
        const username = sessionStorage.getItem("admin_username");
        if (username) {
          setUser({
            id: "session-" + Date.now(),
            username: username,
            isAdmin: true
          });
          setIsAuthenticated(true);
        }
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userData = data.user;
        
        // Store in both localStorage and sessionStorage for redundancy
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_username", username);
        
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error("Login failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_username");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
