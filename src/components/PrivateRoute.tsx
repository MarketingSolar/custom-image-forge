
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner"; // Make sure this component exists

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, checkAuthentication } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(isAuthenticated);

  useEffect(() => {
    const verifyAuth = async () => {
      const authed = await checkAuthentication();
      setIsAuthed(authed);
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuthentication]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Verificando autenticação...</p>
          <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default PrivateRoute;
