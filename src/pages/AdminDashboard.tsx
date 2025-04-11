
import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import ClientsList from "@/components/admin/ClientsList";
import ClientForm from "@/components/admin/ClientForm";
import ClientConfig from "@/components/admin/ClientConfig";
import { LogOut, Users, Settings } from "lucide-react";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <ClientProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className={`bg-brand-DEFAULT text-white ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
          <div className="p-5 border-b border-brand-secondary flex items-center justify-between">
            <h1 className={`font-bold ${sidebarOpen ? 'block' : 'hidden'}`}>Painel Admin</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-brand-secondary"
                  onClick={() => navigate("/admin/dashboard")}
                >
                  <Users className="mr-2 h-5 w-5" />
                  {sidebarOpen && <span>Clientes</span>}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-brand-secondary"
                  onClick={() => navigate("/admin/dashboard/settings")}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  {sidebarOpen && <span>Configurações</span>}
                </Button>
              </li>
            </ul>
          </nav>
          
          <div className="p-4 border-t border-brand-secondary">
            <Button
              variant="outline"
              className="w-full justify-start text-white border-white hover:bg-brand-secondary"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {sidebarOpen && <span>Sair</span>}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Bem-vindo, {user?.username}
                </h2>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto py-6 px-6">
            <Routes>
              <Route path="/" element={<ClientsList />} />
              <Route path="/new" element={<ClientForm />} />
              <Route path="/edit/:clientId" element={<ClientForm />} />
              <Route path="/configure/:clientId" element={<ClientConfig />} />
              <Route path="/settings" element={
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4">Configurações</h2>
                  <p className="text-gray-600">Configurações do sistema serão adicionadas aqui.</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </ClientProvider>
  );
};

export default AdminDashboard;
