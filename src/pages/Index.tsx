
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-DEFAULT to-brand-secondary flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center text-white">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Image className="w-12 h-12 text-brand-DEFAULT" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4">Gerador de Imagens Personalizadas</h1>
        <p className="text-xl mb-8 opacity-90">
          Crie imagens personalizadas com molduras e textos para seus clientes.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button 
            className="text-brand-DEFAULT bg-white hover:bg-gray-100 hover:text-brand-secondary px-8 py-6 text-lg"
            onClick={() => navigate("/admin")}
          >
            Acessar Painel Admin
          </Button>
        </div>
      </div>
      
      <div className="mt-16 text-white text-sm opacity-70">
        <p>Entre com admin / admin123 para acessar o painel administrativo</p>
      </div>
    </div>
  );
};

export default Index;
