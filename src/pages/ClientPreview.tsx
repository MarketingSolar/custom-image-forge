
import { useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useClient, Client, TextPoint } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Download, Image, Upload, RefreshCw } from "lucide-react";
import ImageCanvas from "@/components/client/ImageCanvas";
import NotFound from "./NotFound";

type TextInputValue = {
  [key: string]: string;
};

const ClientPreview = () => {
  const { clientUrl } = useParams<{ clientUrl: string }>();
  const { getClientByUrl } = useClient();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<TextInputValue>({});
  const [isLoading, setIsLoading] = useState(false);
  const [clientPassword, setClientPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load client data
  useEffect(() => {
    if (clientUrl) {
      const foundClient = getClientByUrl(clientUrl);
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
      }
    }
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!client) {
    return <NotFound />;
  }

  if (client.password && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 py-10 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md animate-zoom-fade-in">
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
              <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white">
                Acessar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="animate-zoom-fade-in overflow-hidden shadow-lg border-0">
          <CardHeader className="client-header border-0">
            <div>
              <CardTitle className="client-title text-2xl">Gerador de Imagens</CardTitle>
              <CardDescription className="client-subtitle">
                Crie imagens personalizadas para seus projetos concluídos
              </CardDescription>
            </div>
            <div className="client-logo-container">
              {client.logo ? (
                <img 
                  src={client.logo} 
                  alt={`${client.companyName || client.name} Logo`} 
                  className="client-logo" 
                />
              ) : (
                <div className="client-logo-text">{client.companyName || client.name}</div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Imagem de Fundo</h3>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="tool-button" onClick={triggerFileInput}>
                      <Image className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    <div className="tool-button" onClick={handleCameraCapture}>
                      <Camera className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    {uploadedImage && (
                      <div className="tool-button" onClick={() => setUploadedImage(null)}>
                        <RefreshCw className="h-5 w-5 text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do projeto */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Informações do Projeto</h3>
                  
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
                            className="border-gray-300 focus:border-primary focus:ring-primary"
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
                    className="w-full bg-primary text-white flex items-center justify-center py-6"
                    disabled={!client.frame && !uploadedImage}
                  >
                    <Download className="mr-2 h-5 w-5" /> Baixar Imagem
                  </Button>
                  
                  <Button
                    onClick={() => setUploadedImage(null)}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 flex items-center justify-center"
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
                <h3 className="text-lg font-medium text-gray-800 mb-3">Visualização</h3>
                <div className="aspect-square relative bg-gray-100 border-0 rounded-lg overflow-hidden shadow-inner mx-auto" style={{ maxWidth: "500px" }}>
                  <ImageCanvas
                    ref={canvasRef}
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
