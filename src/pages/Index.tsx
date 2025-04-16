
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Image, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [clientUrl, setClientUrl] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!clientUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o código do cliente."
      });
      setIsLoading(false);
      return;
    }

    // Direct navigation to client URL
    try {
      // Clean URL to remove any special characters
      const cleanUrl = clientUrl.trim().toLowerCase();
      navigate(`/${cleanUrl}`, { state: { password } });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao tentar acessar a página do cliente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-DEFAULT to-brand-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md animate-zoom-fade-in bg-white shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-DEFAULT to-brand-secondary rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-gray-800">Gerador de Imagens</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Entre com seu código de cliente para acessar
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientUrl" className="text-gray-700">Código do Cliente</Label>
              <Input
                id="clientUrl"
                placeholder="Seu código de cliente"
                value={clientUrl}
                onChange={(e) => setClientUrl(e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha (se necessário)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-300"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
              disabled={isLoading}
            >
              <LogIn className="mr-2 h-5 w-5" />
              {isLoading ? "Acessando..." : "Acessar"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between bg-gray-50 p-4">
          <Button
            variant="outline"
            className="text-brand-DEFAULT border-brand-DEFAULT hover:bg-brand-DEFAULT hover:text-white"
            onClick={() => navigate("/admin")}
          >
            Acesso Administrativo
          </Button>
          <p className="text-xs text-gray-500">
            Acesso restrito a clientes
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
