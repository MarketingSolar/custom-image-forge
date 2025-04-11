
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const ClientForm = () => {
  const { clients, addClient, updateClient } = useClient();
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    url: ""
  });
  
  const [errors, setErrors] = useState({
    name: "",
    url: ""
  });

  // Load client data if editing an existing client
  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData({
          name: client.name,
          url: client.url
        });
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [clientId, clients, navigate]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: "", url: "" };
    
    if (!formData.name.trim()) {
      newErrors.name = "O nome do cliente é obrigatório";
      valid = false;
    }
    
    if (!formData.url.trim()) {
      newErrors.url = "A URL do cliente é obrigatória";
      valid = false;
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.url)) {
      newErrors.url = "A URL deve conter apenas letras, números, traços e underscores";
      valid = false;
    } else {
      // Check if URL already exists (except for the current client)
      const existingClient = clients.find(
        c => c.url === formData.url && c.id !== clientId
      );
      if (existingClient) {
        newErrors.url = "Esta URL já está em uso por outro cliente";
        valid = false;
      }
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (clientId) {
      // Updating existing client
      updateClient(clientId, formData);
      toast({
        title: "Cliente atualizado",
        description: `As informações do cliente "${formData.name}" foram atualizadas com sucesso.`
      });
    } else {
      // Creating new client
      addClient({
        ...formData,
        frame: null,
        footer: null,
        logo: null,
        textPoints: []
      });
      toast({
        title: "Cliente criado",
        description: `O cliente "${formData.name}" foi criado com sucesso.`
      });
    }
    
    navigate("/admin/dashboard");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/admin/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{clientId ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cliente</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome da empresa ou cliente"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL Personalizada</Label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">www.meusite.com.br/</span>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="nome-do-cliente"
                  className="flex-1"
                />
              </div>
              {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
              <p className="text-xs text-gray-500">
                Use apenas letras, números, traços e underscores.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary"
            >
              <Save className="mr-2 h-5 w-5" />
              {clientId ? "Atualizar" : "Salvar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ClientForm;
