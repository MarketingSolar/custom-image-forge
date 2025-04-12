
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
};

// API Base URL
const API_BASE_URL = "/api";

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load all clients from the database on initial mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/clients.php`);
        
        if (response.data.success) {
          setClients(response.data.clients);
        } else {
          console.error("Failed to fetch clients:", response.data.message);
          // Load from localStorage as fallback
          const storedClients = localStorage.getItem("clients");
          if (storedClients) {
            setClients(JSON.parse(storedClients));
          }
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        // Load from localStorage as fallback
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
          setClients(JSON.parse(storedClients));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, []);

  // Save to localStorage as a backup whenever clients change
  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients]);

  const addClient = async (client: Omit<Client, "id">) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/clients.php`, client);
      
      if (response.data.success) {
        setClients([...clients, response.data.client]);
        return;
      } else {
        console.error("Failed to add client:", response.data.message);
      }
    } catch (error) {
      console.error("Error adding client:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    const newClient = { 
      ...client, 
      id: Date.now().toString(),
      textPoints: [],
    };
    setClients([...clients, newClient]);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      setIsLoading(true);
      const response = await axios.put(`${API_BASE_URL}/clients.php`, {
        id,
        ...updates
      });
      
      if (response.data.success) {
        // Update the client in the local state
        setClients(clients.map(client => 
          client.id === id ? { ...client, ...updates } : client
        ));
        return;
      } else {
        console.error("Failed to update client:", response.data.message);
      }
    } catch (error) {
      console.error("Error updating client:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    setClients(clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    ));
  };

  const deleteClient = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/clients.php?id=${id}`);
      
      if (response.data.success) {
        // Remove the client from local state
        setClients(clients.filter(client => client.id !== id));
        return;
      } else {
        console.error("Failed to delete client:", response.data.message);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to local storage if API fails
    setClients(clients.filter(client => client.id !== id));
  };

  const getClientByUrl = async (url: string): Promise<Client | undefined> => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/clients.php?url=${url}`);
      
      if (response.data.success) {
        // Update local state to include this client if it's not already there
        const fetchedClient = response.data.client;
        
        // Check if client exists in local state and update it
        const existingClientIndex = clients.findIndex(c => c.id === fetchedClient.id);
        if (existingClientIndex >= 0) {
          const updatedClients = [...clients];
          updatedClients[existingClientIndex] = fetchedClient;
          setClients(updatedClients);
        } else {
          // Add to local state if not found
          setClients([...clients, fetchedClient]);
        }
        
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
      isLoading
    }}>
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
