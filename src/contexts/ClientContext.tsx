
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";

export type TextPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: string[];
  color?: string; 
};

export type Client = {
  id: string;
  name: string;
  companyName?: string;
  url: string;
  frame: string | null;
  footer: string | null;
  logo: string | null;
  password?: string;
  textPoints: TextPoint[];
};

type ClientContextType = {
  clients: Client[];
  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientByUrl: (url: string) => Promise<Client | undefined>;
  addTextPoint: (clientId: string, textPoint: Omit<TextPoint, "id">) => Promise<void>;
  updateTextPoint: (clientId: string, textPointId: string, updates: Partial<TextPoint>) => Promise<void>;
  deleteTextPoint: (clientId: string, textPointId: string) => Promise<void>;
  setCurrentImage: (imageUrl: string | null) => void;
  currentImage: string | null;
  isLoading: boolean;
  refreshClients: () => Promise<void>;
};

// API Base URL
const API_BASE_URL = "/api";

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Function to fetch all clients from the database
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching clients from API...");
      const response = await axios.get(`${API_BASE_URL}/clients.php`);
      console.log("API response:", response.data);
      
      if (response.data.success) {
        setClients(response.data.clients);
        console.log("Successfully loaded clients from API:", response.data.clients.length);
        // Update localStorage for offline backup
        localStorage.setItem("clients", JSON.stringify(response.data.clients));
      } else {
        console.error("Failed to fetch clients:", response.data.message);
        // Load from localStorage as fallback
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
          console.log("Loading clients from localStorage instead");
          setClients(JSON.parse(storedClients));
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      // Load from localStorage as fallback
      const storedClients = localStorage.getItem("clients");
      if (storedClients) {
        console.log("Loading clients from localStorage due to error");
        setClients(JSON.parse(storedClients));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load all clients from the database on initial mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Function to refresh clients data
  const refreshClients = async () => {
    await fetchClients();
  };

  const addClient = async (client: Omit<Client, "id">) => {
    try {
      setIsLoading(true);
      console.log("Adding client:", client);
      
      // Force Content-Type to application/json
      const response = await axios.post(`${API_BASE_URL}/clients.php`, client, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Add client response:", response.data);
      
      if (response.data.success) {
        const newClient = response.data.client;
        setClients(prevClients => [...prevClients, newClient]);
        
        // Update localStorage as backup
        localStorage.setItem("clients", JSON.stringify([...clients, newClient]));
        
        toast({
          title: "Cliente adicionado",
          description: `O cliente ${client.name} foi adicionado com sucesso!`,
        });
        
        return;
      } else {
        console.error("Failed to add client:", response.data.message);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar cliente",
          description: response.data.message || "Ocorreu um erro ao adicionar o cliente.",
        });
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: "Ocorreu um erro ao conectar ao servidor.",
      });
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    const newClient = { 
      ...client, 
      id: Date.now().toString(),
      textPoints: [],
    };
    setClients(prevClients => [...prevClients, newClient]);
    
    // Update localStorage
    localStorage.setItem("clients", JSON.stringify([...clients, newClient]));
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      setIsLoading(true);
      console.log("Updating client:", id, updates);
      
      const response = await axios.put(`${API_BASE_URL}/clients.php`, {
        id,
        ...updates
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Update client response:", response.data);
      
      if (response.data.success) {
        // Update the client in the local state
        const updatedClients = clients.map(client => 
          client.id === id ? { ...client, ...updates } : client
        );
        setClients(updatedClients);
        
        // Update localStorage
        localStorage.setItem("clients", JSON.stringify(updatedClients));
        
        toast({
          title: "Cliente atualizado",
          description: `O cliente foi atualizado com sucesso!`,
        });
        return;
      } else {
        console.error("Failed to update client:", response.data.message);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar cliente",
          description: response.data.message || "Ocorreu um erro ao atualizar o cliente.",
        });
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar cliente",
        description: "Ocorreu um erro ao conectar ao servidor.",
      });
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    const updatedClients = clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    );
    setClients(updatedClients);
    
    // Update localStorage
    localStorage.setItem("clients", JSON.stringify(updatedClients));
  };

  const deleteClient = async (id: string) => {
    try {
      setIsLoading(true);
      console.log("Deleting client:", id);
      
      const response = await axios.delete(`${API_BASE_URL}/clients.php?id=${id}`);
      console.log("Delete client response:", response.data);
      
      if (response.data.success) {
        // Remove the client from local state
        const updatedClients = clients.filter(client => client.id !== id);
        setClients(updatedClients);
        
        // Update localStorage
        localStorage.setItem("clients", JSON.stringify(updatedClients));
        
        toast({
          title: "Cliente excluído",
          description: `O cliente foi excluído com sucesso!`,
        });
        return;
      } else {
        console.error("Failed to delete client:", response.data.message);
        toast({
          variant: "destructive",
          title: "Erro ao excluir cliente",
          description: response.data.message || "Ocorreu um erro ao excluir o cliente.",
        });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: "Ocorreu um erro ao conectar ao servidor.",
      });
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    const updatedClients = clients.filter(client => client.id !== id);
    setClients(updatedClients);
    
    // Update localStorage
    localStorage.setItem("clients", JSON.stringify(updatedClients));
  };

  const getClientByUrl = async (url: string): Promise<Client | undefined> => {
    try {
      setIsLoading(true);
      console.log("Getting client by URL:", url);
      
      const response = await axios.get(`${API_BASE_URL}/clients.php?url=${url}`);
      console.log("Get client by URL response:", response.data);
      
      if (response.data.success) {
        // Update local state to include this client if it's not already there
        const fetchedClient = response.data.client;
        
        // Check if client exists in local state and update it
        const existingClientIndex = clients.findIndex(c => c.id === fetchedClient.id);
        let updatedClients = [...clients];
        
        if (existingClientIndex >= 0) {
          updatedClients[existingClientIndex] = fetchedClient;
        } else {
          // Add to local state if not found
          updatedClients = [...clients, fetchedClient];
        }
        
        setClients(updatedClients);
        
        // Update localStorage
        localStorage.setItem("clients", JSON.stringify(updatedClients));
        
        return fetchedClient;
      } else {
        console.error("Failed to get client by URL:", response.data.message);
      }
    } catch (error) {
      console.error("Error getting client by URL:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    return clients.find(client => client.url === url);
  };

  const addTextPoint = async (clientId: string, textPoint: Omit<TextPoint, "id">) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const newTextPoint = { ...textPoint, id: Date.now().toString() };
    const updatedClient = {
      ...client,
      textPoints: [...client.textPoints, newTextPoint]
    };
    
    await updateClient(clientId, updatedClient);
  };

  const updateTextPoint = async (clientId: string, textPointId: string, updates: Partial<TextPoint>) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const updatedTextPoints = client.textPoints.map(point => 
      point.id === textPointId ? { ...point, ...updates } : point
    );
    
    await updateClient(clientId, { textPoints: updatedTextPoints });
  };

  const deleteTextPoint = async (clientId: string, textPointId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const updatedTextPoints = client.textPoints.filter(point => point.id !== textPointId);
    
    await updateClient(clientId, { textPoints: updatedTextPoints });
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
      addClient, 
      updateClient, 
      deleteClient, 
      getClientByUrl,
      addTextPoint,
      updateTextPoint,
      deleteTextPoint,
      currentImage,
      setCurrentImage,
      isLoading,
      refreshClients
    }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-2 text-gray-700">Carregando...</p>
          </div>
        </div>
      )}
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
