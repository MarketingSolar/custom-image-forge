
import React, { createContext, useContext, useState, useEffect } from "react";

export type TextPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: string[];
  color?: string; // Add color property for text
};

export type Client = {
  id: string;
  name: string;
  url: string;
  frame: string | null;
  footer: string | null;
  logo: string | null;
  textPoints: TextPoint[];
};

type ClientContextType = {
  clients: Client[];
  addClient: (client: Omit<Client, "id">) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientByUrl: (url: string) => Client | undefined;
  addTextPoint: (clientId: string, textPoint: Omit<TextPoint, "id">) => void;
  updateTextPoint: (clientId: string, textPointId: string, updates: Partial<TextPoint>) => void;
  deleteTextPoint: (clientId: string, textPointId: string) => void;
  setCurrentImage: (imageUrl: string | null) => void;
  currentImage: string | null;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// In a real app, this would connect to a backend API
export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  useEffect(() => {
    // Load from localStorage on initial mount
    const storedClients = localStorage.getItem("clients");
    if (storedClients) {
      setClients(JSON.parse(storedClients));
    }
  }, []);

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients]);

  const addClient = (client: Omit<Client, "id">) => {
    const newClient = { 
      ...client, 
      id: Date.now().toString(),
      textPoints: [],
    };
    setClients([...clients, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    ));
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(client => client.id !== id));
  };

  const getClientByUrl = (url: string) => {
    return clients.find(client => client.url === url);
  };

  const addTextPoint = (clientId: string, textPoint: Omit<TextPoint, "id">) => {
    setClients(clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          textPoints: [
            ...client.textPoints,
            { ...textPoint, id: Date.now().toString() }
          ]
        };
      }
      return client;
    }));
  };

  const updateTextPoint = (clientId: string, textPointId: string, updates: Partial<TextPoint>) => {
    setClients(clients.map(client => {
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
  };

  const deleteTextPoint = (clientId: string, textPointId: string) => {
    setClients(clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          textPoints: client.textPoints.filter(point => point.id !== textPointId)
        };
      }
      return client;
    }));
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
      setCurrentImage
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
