
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, checkAuthentication } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(isAuthenticated);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log("Checking authentication...");
        const authed = await checkAuthentication();
        console.log("Authentication check result:", authed);
        setIsAuthed(authed);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [checkAuthentication]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Verificando autenticação...</p>
          <Spinner size="md" className="mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/admin" replace />;
  }

  console.log("Authentication successful, showing protected content");
  return children;
};

export default PrivateRoute;
