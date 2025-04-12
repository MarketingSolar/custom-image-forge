import { useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
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
  const { getClientByUrl, isLoading } = useClient();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<TextInputValue>({});
  const [loading, setLoading] = useState(true);
  const [clientPassword, setClientPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientUrl) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      try {
        const foundClient = await getClientByUrl(clientUrl);
        
        if (foundClient) {
          setClient(foundClient);
          
          // Initialize text values
          const initialValues: TextInputValue = {};
          foundClient.textPoints.forEach(point => {
            initialValues[point.id] = "";
          });
          setTextValues(initialValues);
          
          // If client doesn't have a password requirement, set as authenticated
          if (!foundClient.password) {
            setIsAuthenticated(true);
          }
          
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching client:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClient();
  }, [clientUrl, getClientByUrl]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client && client.password === clientPassword) {
      setIsAuthenticated(true);
    } else {
      toast({
        variant: "destructive",
        title: "Senha incorreta",
        description: "A senha informada não está correta."
      });
    }
  };

  const handleFileUpload = (file: File) => {
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setLoading(false);
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Erro ao carregar imagem",
        description: "Não foi possível carregar a imagem selecionada."
      });
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element to show camera stream
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // Create a modal/overlay to show camera preview
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
      
      // Start video playback
      video.play();
      
      // Handle capture
      captureButton.onclick = () => {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        // Get image data
        const imageData = canvas.toDataURL('image/png');
        setUploadedImage(imageData);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
      };
      
      // Handle cancel
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 flex items-center justify-center">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (client && client.password && !isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="animate-zoom-fade-in shadow-sm border-0">
          <div className="bg-white pt-4 px-6 pb-0">
            <div className="flex items-center mb-2">
              {client?.logo ? (
                <img 
                  src={client.logo} 
                  alt={`${client.companyName || client.name} Logo`} 
                  className="h-8 mr-4" 
                />
              ) : (
                <div className="text-xl font-medium text-gray-800 mr-4">{client?.companyName || client?.name}</div>
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
                    <div className="tool-button" onClick={triggerFileInput}>
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

                {/* Informaç��es do projeto */}
                <div>
                  <h3 className="client-section-title">Informações do Projeto</h3>
                  
                  {client?.textPoints.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Não há campos de informação configurados para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {client?.textPoints.map((point, index) => (
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
                
                {/* Botões de ação */}
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="client-button-primary"
                    disabled={!client?.frame && !uploadedImage}
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
                    frameImage={client?.frame}
                    footerImage={null}
                    textPoints={client?.textPoints || []}
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
