
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao painel administrativo!",
        });
        navigate("/admin/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Erro de login",
          description: "Usuário ou senha incorretos.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de login",
        description: "Ocorreu um erro ao tentar fazer login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-brand-DEFAULT to-brand-secondary p-4">
      <Card className="w-full max-w-md animate-zoom-fade-in bg-white shadow-xl">
        <CardHeader className="space-y-1 bg-gray-50">
          <CardTitle className="text-2xl text-center text-gray-800">Painel Administrativo</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Usuário</Label>
              <Input
                id="username"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50 text-gray-600">
          <p className="text-sm">
            Use admin / admin123 para testar
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
