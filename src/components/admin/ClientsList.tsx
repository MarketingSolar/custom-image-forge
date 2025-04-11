
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ClientsList = () => {
  const { clients, deleteClient } = useClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
      deleteClient(id);
      toast({
        title: "Cliente excluído",
        description: `O cliente "${name}" foi excluído com sucesso.`
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gerenciar Clientes</h2>
        <Button 
          onClick={() => navigate("/admin/dashboard/new")}
          className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary"
        >
          <Plus className="mr-2 h-5 w-5" /> Novo Cliente
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-lg text-gray-500 mb-4">Nenhum cliente cadastrado</p>
            <Button 
              onClick={() => navigate("/admin/dashboard/new")}
              className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary"
            >
              <Plus className="mr-2 h-5 w-5" /> Adicionar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="overflow-hidden animate-fade-in">
              <CardContent className="p-0">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{client.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">URL: {client.url}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-gray-200 rounded-full w-2 h-2 mr-2"></span>
                    {client.textPoints.length} campo(s) configurado(s)
                  </div>
                </div>
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/dashboard/edit/${client.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/dashboard/configure/${client.id}`)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Configurar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(client.id, client.name)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsList;
