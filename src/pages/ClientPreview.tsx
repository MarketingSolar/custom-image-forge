
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
      }
    }
  }, [clientUrl, getClientByUrl]);

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

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <Card className="animate-zoom-fade-in overflow-hidden shadow-lg border-0">
          <CardHeader className="client-header">
            <div>
              <CardTitle className="client-title text-2xl">Gerador de Imagens</CardTitle>
              <CardDescription className="client-subtitle">
                Crie sua imagem personalizada para {client.name}
              </CardDescription>
            </div>
            <div className="client-logo-container">
              {client.logo ? (
                <img 
                  src={client.logo} 
                  alt={`${client.name} Logo`} 
                  className="client-logo" 
                />
              ) : (
                <div className="client-logo-text">{client.name}</div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-2/3 space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={triggerFileInput}
                    className="tool-button"
                    title="Selecionar imagem da galeria"
                  >
                    <Image className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleCameraCapture}
                    className="tool-button"
                    title="Capturar imagem da câmera"
                  >
                    <Camera className="h-5 w-5 text-gray-700" />
                  </button>
                  {uploadedImage && (
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="tool-button"
                      title="Nova imagem"
                    >
                      <RefreshCw className="h-5 w-5 text-gray-700" />
                    </button>
                  )}
                </div>
                
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden shadow-inner" style={{ maxWidth: "95%" }}>
                  <ImageCanvas
                    ref={canvasRef}
                    backgroundImage={uploadedImage}
                    frameImage={client.frame}
                    footerImage={client.footer}
                    textPoints={client.textPoints}
                    textValues={textValues}
                  />
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
              
              <div className="w-full lg:w-1/3">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Informações do Projeto</h3>
                  
                  {client.textPoints.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Não há campos de informação configurados para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {client.textPoints.map((point, index) => (
                        <div key={point.id} className="space-y-1">
                          <Label htmlFor={`text-${point.id}`} className="text-gray-700">
                            {point.name}
                          </Label>
                          <Input
                            id={`text-${point.id}`}
                            value={textValues[point.id] || ""}
                            onChange={(e) => handleTextChange(point.id, e.target.value)}
                            placeholder={`Digite ${point.name.toLowerCase()}`}
                            className="border-gray-300 focus:border-brand-DEFAULT focus:ring-brand-DEFAULT"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 border-t p-4">
            <Button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-brand-DEFAULT to-brand-secondary text-white"
              disabled={!client.frame && !uploadedImage}
            >
              <Download className="mr-2 h-5 w-5" /> Baixar Imagem
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ClientPreview;
