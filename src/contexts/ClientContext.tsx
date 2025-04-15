
import React, { createContext, useContext, useState, useEffect } from "react";

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
  loading: boolean;
  error: string | null;
  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientByUrl: (url: string) => Client | undefined;
  addTextPoint: (clientId: string, textPoint: Omit<TextPoint, "id">) => Promise<void>;
  updateTextPoint: (clientId: string, textPointId: string, updates: Partial<TextPoint>) => Promise<void>;
  deleteTextPoint: (clientId: string, textPointId: string) => Promise<void>;
  setCurrentImage: (imageUrl: string | null) => void;
  currentImage: string | null;
  refreshClients: () => Promise<void>;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// DB connection settings
const DB_CONFIG = {
  host: "srv1066.hstgr.io",
  database: "u961166301_moldura",
  user: "u961166301_moldura",
  password: "@Moldura123"
};

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch clients from the database
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/clients.php?action=list');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched clients:", data);
      
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error("Expected array of clients but got:", data);
        setClients([]);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError(`Failed to fetch clients: ${err instanceof Error ? err.message : String(err)}`);
      // Fallback to localStorage if API fails
      const storedClients = localStorage.getItem("clients");
      if (storedClients) {
        try {
          setClients(JSON.parse(storedClients));
        } catch (e) {
          console.error("Error parsing stored clients:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchClients();
  }, []);

  // Save to localStorage as backup whenever clients change
  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients]);

  const refreshClients = async () => {
    await fetchClients();
  };

  const addClient = async (client: Omit<Client, "id">) => {
    setLoading(true);
    setError(null);
    
    try {
      const newClient = { 
        ...client, 
        id: Date.now().toString(),
        textPoints: [],
      };
      
      const response = await fetch('/api/clients.php?action=add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Add client result:", result);
      
      if (result.success) {
        // Update local state with the new client including any server-generated ID
        const updatedClient = result.client || newClient;
        setClients(prevClients => [...prevClients, updatedClient]);
      } else {
        throw new Error(result.message || "Failed to add client");
      }
    } catch (err) {
      console.error("Error adding client:", err);
      setError(`Error adding client: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      const newClient = { 
        ...client, 
        id: Date.now().toString(),
        textPoints: [],
      };
      setClients(prevClients => [...prevClients, newClient]);
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setLoading(true);
    setError(null);
    
    try {
      const clientToUpdate = clients.find(client => client.id === id);
      if (!clientToUpdate) {
        throw new Error("Client not found");
      }
      
      const updatedClient = { ...clientToUpdate, ...updates };
      
      const response = await fetch('/api/clients.php?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClient),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Update client result:", result);
      
      if (result.success) {
        setClients(prevClients => 
          prevClients.map(client => client.id === id ? updatedClient : client)
        );
      } else {
        throw new Error(result.message || "Failed to update client");
      }
    } catch (err) {
      console.error("Error updating client:", err);
      setError(`Error updating client: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      setClients(prevClients => 
        prevClients.map(client => client.id === id ? { ...client, ...updates } : client)
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/clients.php?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Delete client result:", result);
      
      if (result.success) {
        setClients(prevClients => prevClients.filter(client => client.id !== id));
      } else {
        throw new Error(result.message || "Failed to delete client");
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(`Error deleting client: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      setClients(prevClients => prevClients.filter(client => client.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getClientByUrl = (url: string) => {
    return clients.find(client => client.url === url);
  };

  const addTextPoint = async (clientId: string, textPoint: Omit<TextPoint, "id">) => {
    setLoading(true);
    setError(null);
    
    try {
      const newTextPoint = { ...textPoint, id: Date.now().toString() };
      
      const response = await fetch('/api/textpoints.php?action=add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, textPoint: newTextPoint }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Add text point result:", result);
      
      if (result.success) {
        setClients(prevClients => prevClients.map(client => {
          if (client.id === clientId) {
            return {
              ...client,
              textPoints: [...client.textPoints, result.textPoint || newTextPoint]
            };
          }
          return client;
        }));
      } else {
        throw new Error(result.message || "Failed to add text point");
      }
    } catch (err) {
      console.error("Error adding text point:", err);
      setError(`Error adding text point: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      const newTextPoint = { ...textPoint, id: Date.now().toString() };
      setClients(prevClients => prevClients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            textPoints: [...client.textPoints, newTextPoint]
          };
        }
        return client;
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateTextPoint = async (clientId: string, textPointId: string, updates: Partial<TextPoint>) => {
    setLoading(true);
    setError(null);
    
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        throw new Error("Client not found");
      }
      
      const textPoint = client.textPoints.find(p => p.id === textPointId);
      if (!textPoint) {
        throw new Error("Text point not found");
      }
      
      const updatedTextPoint = { ...textPoint, ...updates };
      
      const response = await fetch('/api/textpoints.php?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, textPoint: updatedTextPoint }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Update text point result:", result);
      
      if (result.success) {
        setClients(prevClients => prevClients.map(client => {
          if (client.id === clientId) {
            return {
              ...client,
              textPoints: client.textPoints.map(point => 
                point.id === textPointId ? updatedTextPoint : point
              )
            };
          }
          return client;
        }));
      } else {
        throw new Error(result.message || "Failed to update text point");
      }
    } catch (err) {
      console.error("Error updating text point:", err);
      setError(`Error updating text point: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      setClients(prevClients => prevClients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            textPoints: client.textPoints.map(point => 
              point.id === textPointId ? { ...point, ...updates } : point
            )
          };
        }
        return client;
      }));
    } finally {
      setLoading(false);
    }
  };

  const deleteTextPoint = async (clientId: string, textPointId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/textpoints.php?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, textPointId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Delete text point result:", result);
      
      if (result.success) {
        setClients(prevClients => prevClients.map(client => {
          if (client.id === clientId) {
            return {
              ...client,
              textPoints: client.textPoints.filter(point => point.id !== textPointId)
            };
          }
          return client;
        }));
      } else {
        throw new Error(result.message || "Failed to delete text point");
      }
    } catch (err) {
      console.error("Error deleting text point:", err);
      setError(`Error deleting text point: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to localStorage if API fails
      setClients(prevClients => prevClients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            textPoints: client.textPoints.filter(point => point.id !== textPointId)
          };
        }
        return client;
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
      loading,
      error,
      addClient, 
      updateClient, 
      deleteClient, 
      getClientByUrl,
      addTextPoint,
      updateTextPoint,
      deleteTextPoint,
      currentImage,
      setCurrentImage,
      refreshClients
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
