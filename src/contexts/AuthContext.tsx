
import React, { createContext, useContext, useState, useEffect } from "react";
import { authenticateUser, getUserById } from "@/utils/database";

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
    // Check for stored user ID on initial load
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      const fetchUser = async () => {
        const dbUser = await getUserById(storedUserId);
        if (dbUser) {
          const userObj: User = {
            id: dbUser.id,
            username: dbUser.username,
            isAdmin: dbUser.isAdmin,
          };
          setUser(userObj);
          setIsAuthenticated(true);
        } else {
          // User not found in DB, clear localStorage
          localStorage.removeItem("userId");
        }
      };
      
      fetchUser();
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Real authentication via database
    const dbUser = await authenticateUser(username, password);
    
    if (dbUser) {
      const userObj: User = {
        id: dbUser.id,
        username: dbUser.username,
        isAdmin: dbUser.isAdmin,
      };
      
      // Store only the user ID in localStorage
      localStorage.setItem("userId", dbUser.id);
      setUser(userObj);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    localStorage.removeItem("userId");
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
