
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Camera, Download, Image, Upload, RefreshCw, AlignCenter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ImageCanvas from "@/components/client/ImageCanvas";
import { Spinner } from "@/components/ui/spinner";

type TextPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: string[];
  color?: string;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Client information (hardcoded for this example)
  const clientInfo = {
    name: "Cliente Demonstração",
    companyName: "Empresa Demonstração",
    textPoints: [
      {
        id: "1",
        name: "Nome do Cliente",
        x: 50,
        y: 50,
        fontFamily: "Arial",
        fontSize: 24,
        fontStyle: ["bold"],
        color: "#000000"
      },
      {
        id: "2",
        name: "Descrição do Projeto",
        x: 50,
        y: 100,
        fontFamily: "Arial",
        fontSize: 16,
        fontStyle: [],
        color: "#333333"
      }
    ]
  };
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<{[key: string]: string}>({
    "1": "",
    "2": ""
  });
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load the frame image
  const [frameImage, setFrameImage] = useState<string | null>(null);
  
  useEffect(() => {
    // Load the frame image
    setFrameImage("moldura.png");
  }, []);

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

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="animate-zoom-fade-in shadow-sm border-0">
          <div className="bg-white pt-4 px-6 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-medium text-gray-800 mr-4">{clientInfo.companyName}</div>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => navigate("/admin")}
              >
                Área do Admin
              </Button>
            </div>
            <div className="client-header pb-4">
              <h1 className="text-2xl font-bold text-gray-900">Gerador de Imagens</h1>
              <p className="text-gray-600">
                Crie imagens personalizadas para seus projetos concluídos
              </p>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 space-y-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Imagem de Fundo</h3>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button className="p-2 border rounded hover:bg-gray-50" onClick={triggerFileInput}>
                      <Image className="h-5 w-5 text-gray-700" />
                    </button>
                    
                    <button className="p-2 border rounded hover:bg-gray-50" onClick={handleCameraCapture}>
                      <Camera className="h-5 w-5 text-gray-700" />
                    </button>
                    
                    <button className="p-2 border rounded hover:bg-gray-50" onClick={handleCenterImage}>
                      <AlignCenter className="h-5 w-5 text-gray-700" />
                    </button>
                    
                    {uploadedImage && (
                      <button className="p-2 border rounded hover:bg-gray-50" onClick={() => setUploadedImage(null)}>
                        <RefreshCw className="h-5 w-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Informações do projeto */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Informações do Projeto</h3>
                  
                  <div className="space-y-4">
                    {clientInfo.textPoints.map((point) => (
                      <div key={point.id} className="space-y-2">
                        <Label htmlFor={`text-${point.id}`} className="text-gray-700">
                          {point.name}
                        </Label>
                        <Input
                          id={`text-${point.id}`}
                          value={textValues[point.id] || ""}
                          onChange={(e) => handleTextChange(point.id, e.target.value)}
                          placeholder={`Digite ${point.name.toLowerCase()}`}
                          className="border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!uploadedImage}
                  >
                    <Download className="mr-2 h-5 w-5" /> Baixar Imagem
                  </Button>
                  
                  <Button
                    onClick={() => setUploadedImage(null)}
                    variant="outline"
                    className="border-gray-300 text-gray-700"
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
                <h3 className="font-medium text-gray-900 mb-3">Visualização</h3>
                <div className="aspect-square relative bg-white mx-auto border" style={{ maxWidth: "500px" }}>
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <ImageCanvas
                      ref={(el) => {
                        canvasRef.current = el;
                        imageCanvasRef.current = el;
                      }}
                      backgroundImage={uploadedImage}
                      frameImage={frameImage}
                      footerImage={null}
                      textPoints={clientInfo.textPoints}
                      textValues={textValues}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
