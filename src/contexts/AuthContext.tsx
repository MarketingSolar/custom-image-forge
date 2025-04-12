import React, { createContext, useContext, useState, useEffect } from "react";
import { authenticateUser, getUserById } from "@/utils/database";
import { useToast } from "@/components/ui/use-toast";

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
  checkAuthentication: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  
  const checkAuthentication = async (): Promise<boolean> => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      return false;
    }
    
    try {
      const dbUser = await getUserById(storedUserId);
      if (dbUser) {
        const userObj: User = {
          id: dbUser.id,
          username: dbUser.username,
          isAdmin: dbUser.isAdmin,
        };
        setUser(userObj);
        setIsAuthenticated(true);
        return true;
      } else {
        localStorage.removeItem("userId");
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      if (user) {
        return true;
      }
      return false;
    }
  };
  
  useEffect(() => {
    const initAuth = async () => {
      await checkAuthentication();
    };
    
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const dbUser = await authenticateUser(username, password);
      
      if (dbUser) {
        const userObj: User = {
          id: dbUser.id,
          username: dbUser.username,
          isAdmin: dbUser.isAdmin,
        };
        
        localStorage.setItem("userId", dbUser.id);
        setUser(userObj);
        setIsAuthenticated(true);
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${dbUser.username}!`,
        });
        
        return true;
      } else {
        console.log("Login failed: Invalid credentials");
        toast({
          variant: "destructive",
          title: "Erro de login",
          description: "Nome de usuário ou senha inválidos",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Erro de login",
        description: "Ocorreu um erro ao tentar fazer login",
      });
    }
    
    return false;
  };

  const logout = () => {
    localStorage.removeItem("userId");
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logout bem-sucedido",
      description: "Você foi desconectado com sucesso",
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
      checkAuthentication
    }}>
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
