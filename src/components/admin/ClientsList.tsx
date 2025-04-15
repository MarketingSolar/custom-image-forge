
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Settings, Globe, Key, Building2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ClientsList = () => {
  const { clients, deleteClient, loading, error, refreshClients } = useClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
      try {
        await deleteClient(id);
        toast({
          title: "Cliente excluído",
          description: `O cliente "${name}" foi excluído com sucesso.`
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível excluir o cliente. Tente novamente."
        });
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshClients();
      toast({
        title: "Lista atualizada",
        description: "A lista de clientes foi atualizada com sucesso."
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista de clientes."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Clientes</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="text-gray-700"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> 
            Atualizar Lista
          </Button>
          <Button 
            onClick={() => navigate("/admin/dashboard/new")}
            className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
          >
            <Plus className="mr-2 h-5 w-5" /> Novo Cliente
          </Button>
        </div>
      </div>

      {error && (
        <Card className="shadow-md border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2 bg-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && clients.length === 0 ? (
        <Card className="shadow-md border-gray-200">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-DEFAULT"></div>
            <p className="text-lg text-gray-500 mt-4">Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card className="shadow-md border-gray-200">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-lg text-gray-500 mb-4">Nenhum cliente cadastrado</p>
            <Button 
              onClick={() => navigate("/admin/dashboard/new")}
              className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
            >
              <Plus className="mr-2 h-5 w-5" /> Adicionar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="overflow-hidden animate-fade-in shadow-md border-gray-200">
              <CardContent className="p-0">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{client.name}</h3>
                  
                  <div className="space-y-1 mt-4 text-sm text-gray-600">
                    {client.companyName && (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{client.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <span>/{client.url}</span>
                    </div>
                    {client.password && (
                      <div className="flex items-center">
                        <Key className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Acesso protegido por senha</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mt-3">
                    <span className="bg-gray-200 rounded-full w-2 h-2 mr-2"></span>
                    {client.textPoints?.length || 0} campo(s) configurado(s)
                  </div>
                </div>
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/dashboard/edit/${client.id}`)}
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && clients.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-DEFAULT"></div>
          <p className="text-sm text-gray-500 mt-2">Atualizando dados...</p>
        </div>
      )}
    </div>
  );
};

export default ClientsList;
