
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Upload } from "lucide-react";

const ClientForm = () => {
  const { clients, addClient, updateClient } = useClient();
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    url: "",
    logo: null as string | null,
    password: ""
  });
  
  const [errors, setErrors] = useState({
    name: "",
    companyName: "",
    url: "",
    password: ""
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load client data if editing an existing client
  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData({
          name: client.name,
          companyName: client.companyName || "",
          url: client.url,
          logo: client.logo,
          password: client.password || ""
        });
        setLogoPreview(client.logo);
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [clientId, clients, navigate]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: "", companyName: "", url: "", password: "" };
    
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoData = event.target?.result as string;
      setLogoPreview(logoData);
      setFormData(prev => ({ ...prev, logo: logoData }));
    };
    reader.readAsDataURL(file);
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
        className="mb-4 text-gray-800"
        onClick={() => navigate("/admin/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-800">{clientId ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Nome do Cliente</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome da empresa ou cliente"
                className="border-gray-300"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-700">Nome da Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Nome comercial da empresa"
                className="border-gray-300"
              />
              {errors.companyName && <p className="text-sm text-red-500">{errors.companyName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-700">URL Personalizada</Label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">www.meusite.com.br/</span>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="nome-do-cliente"
                  className="flex-1 border-gray-300"
                />
              </div>
              {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
              <p className="text-xs text-gray-500">
                Use apenas letras, números, traços e underscores.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Senha de Acesso do Cliente</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Senha de acesso (opcional)"
                className="border-gray-300"
              />
              <p className="text-xs text-gray-500">
                Deixe em branco para acesso público sem senha.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-gray-700">Logo da Empresa</Label>
              <div className="flex flex-col space-y-3">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="border-gray-300"
                />
                {logoPreview && (
                  <div className="mt-2 border rounded-md p-2 bg-gray-50 max-w-xs">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="max-h-24 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-gray-50 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
              className="border-gray-300 text-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
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
