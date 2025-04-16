import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
import { useClient, Client, TextPoint } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Download, Image, Upload, RefreshCw, AlignCenter } from "lucide-react";
import ImageCanvas from "@/components/client/ImageCanvas";
import NotFound from "./NotFound";

type TextInputValue = {
  [key: string]: string;
};

const ClientPreview = () => {
  const { clientUrl } = useParams<{ clientUrl: string }>();
  const location = useLocation();
  const { getClientByUrl, clients } = useClient();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<TextInputValue>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [clientPassword, setClientPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClientFound, setIsClientFound] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!clientUrl) {
      setIsLoading(false);
      setIsError(true);
      return;
    }
    
    const localClient = getClientByUrl(clientUrl);
    if (localClient) {
      handleClientData(localClient);
      return;
    }
    
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/check_client.php?clientUrl=${clientUrl}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const responseText = await response.text();
        
        if (responseText.trim().startsWith('<?php')) {
          throw new Error("Server configuration issue: PHP code is being returned instead of executed");
        }
        
        const data = JSON.parse(responseText);
        
        if (data.success && data.client) {
          handleClientData(data.client);
        } else {
          setIsClientFound(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error verifying client:", error);
        const fallbackClient = getClientByUrl(clientUrl);
        if (fallbackClient) {
          handleClientData(fallbackClient);
        } else {
          setIsClientFound(false);
          setIsLoading(false);
          setIsError(true);
        }
      }
    };
    
    fetchClient();
  }, [clientUrl, getClientByUrl, clients]);
  
  const handleClientData = (clientData: Client) => {
    setClient(clientData);
    setIsClientFound(true);
    
    const initialValues: TextInputValue = {};
    clientData.textPoints?.forEach(point => {
      initialValues[point.id] = "";
    });
    setTextValues(initialValues);
    
    const authKey = `client_auth_${clientUrl}`;
    const storedAuth = localStorage.getItem(authKey);
    
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else if (!clientData.password) {
      setIsAuthenticated(true);
      localStorage.setItem(authKey, "true");
    } else if (location.state?.password) {
      if (location.state.password === clientData.password) {
        setIsAuthenticated(true);
        localStorage.setItem(authKey, "true");
      }
      setClientPassword(location.state.password || "");
    }
    
    setIsLoading(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client && client.password === clientPassword) {
      setIsAuthenticated(true);
      localStorage.setItem(`client_auth_${clientUrl}`, "true");
      sessionStorage.setItem(`client_session_${clientUrl}`, "active");
    } else {
      toast({
        variant: "destructive",
        title: "Senha incorreta",
        description: "A senha informada não está correta."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-4">Não foi possível carregar os dados do cliente. Verifique se o URL está correto.</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">Voltar para a página inicial</a>
        </div>
      </div>
    );
  }

  if (!isClientFound || !client) {
    return <NotFound />;
  }

  if (client.password && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md animate-zoom-fade-in shadow-md border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">Área Restrita</CardTitle>
            <CardDescription>
              Esta área é protegida. Digite a senha para continuar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha de acesso</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  placeholder="Digite a senha"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Acessar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Erro ao carregar imagem",
        description: "Não foi possível carregar a imagem selecionada."
      });
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
      
      const cameraContainer = document.createElement('div');
      cameraContainer.className = 'bg-white p-4 rounded-lg max-w-lg w-full';
      
      const header = document.createElement('div');
      header.className = 'text-xl font-bold mb-3';
      header.textContent = 'Capturar Foto';
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'relative aspect-square overflow-hidden bg-black mb-3';
      videoContainer.appendChild(video);
      
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'flex justify-between';
      
      const captureButton = document.createElement('button');
      captureButton.className = 'px-4 py-2 bg-blue-500 text-white rounded';
      captureButton.textContent = 'Capturar';
      
      const cancelButton = document.createElement('button');
      cancelButton.className = 'px-4 py-2 bg-gray-300 text-gray-800 rounded';
      cancelButton.textContent = 'Cancelar';
      
      buttonsContainer.appendChild(cancelButton);
      buttonsContainer.appendChild(captureButton);
      
      cameraContainer.appendChild(header);
      cameraContainer.appendChild(videoContainer);
      cameraContainer.appendChild(buttonsContainer);
      overlay.appendChild(cameraContainer);
      document.body.appendChild(overlay);
      
      video.play();
      
      captureButton.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        setUploadedImage(imageData);
        
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
      };
      
      cancelButton.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
      };
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      });
    }
  };

  const handleTextChange = (pointId: string, value: string) => {
    setTextValues({
      ...textValues,
      [pointId]: value
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "imagem_personalizada.png";
      link.href = dataURL;
      link.click();
      
      toast({
        title: "Download iniciado",
        description: "Sua imagem personalizada foi baixada com sucesso!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: "Não foi possível fazer o download da imagem."
      });
    }
  };
  
  const handleCenterImage = () => {
    if (imageCanvasRef.current && imageCanvasRef.current.centerImage) {
      imageCanvasRef.current.centerImage();
      toast({
        title: "Imagem centralizada",
        description: "A imagem foi centralizada na moldura."
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="animate-zoom-fade-in shadow-sm border-0">
          <div className="bg-white pt-4 px-6 pb-0">
            <div className="flex items-center mb-2">
              {client.logo ? (
                <img 
                  src={client.logo} 
                  alt={`${client.companyName || client.name} Logo`} 
                  className="h-8 mr-4" 
                />
              ) : (
                <div className="text-xl font-medium text-gray-800 mr-4">{client.companyName || client.name}</div>
              )}
            </div>
            <div className="client-header pb-4">
              <h1 className="client-title">Gerador de Imagens</h1>
              <p className="client-subtitle">
                Crie imagens personalizadas para seus projetos concluídos
              </p>
            </div>
          </div>
          
          <CardContent className="client-content p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 space-y-8">
                <div>
                  <h3 className="client-section-title">Imagem de Fundo</h3>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="tool-button" onClick={() => fileInputRef.current?.click()}>
                      <Image className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    <div className="tool-button" onClick={handleCameraCapture}>
                      <Camera className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    <div className="tool-button" onClick={handleCenterImage}>
                      <AlignCenter className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    {uploadedImage && (
                      <div className="tool-button" onClick={() => setUploadedImage(null)}>
                        <RefreshCw className="h-5 w-5 text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="client-section-title">Informações do Projeto</h3>
                  
                  {client.textPoints.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Não há campos de informação configurados para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {client.textPoints.map((point, index) => (
                        <div key={point.id} className="space-y-2">
                          <Label htmlFor={`text-${point.id}`} className="text-gray-700">
                            {point.name} {index + 1}
                          </Label>
                          <Input
                            id={`text-${point.id}`}
                            value={textValues[point.id] || ""}
                            onChange={(e) => handleTextChange(point.id, e.target.value)}
                            placeholder={`Digite ${point.name.toLowerCase()}`}
                            className="client-input"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="client-button-primary"
                    disabled={!client.frame && !uploadedImage}
                  >
                    <Download className="mr-2 h-5 w-5" /> Baixar Imagem
                  </Button>
                  
                  <Button
                    onClick={() => setUploadedImage(null)}
                    variant="outline"
                    className="client-button-secondary"
                    disabled={!uploadedImage}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" /> Nova Imagem
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFileUpload(files[0]);
                    }
                  }}
                />
              </div>
              
              <div className="w-full md:w-1/2">
                <h3 className="client-section-title">Visualização</h3>
                <div className="preview-container aspect-square relative bg-white mx-auto" style={{ maxWidth: "500px" }}>
                  <ImageCanvas
                    ref={(el) => {
                      canvasRef.current = el;
                      imageCanvasRef.current = el;
                    }}
                    backgroundImage={uploadedImage}
                    frameImage={client.frame}
                    footerImage={null}
                    textPoints={client.textPoints}
                    textValues={textValues}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPreview;
