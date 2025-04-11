
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClient, TextPoint, Client } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Save, Trash2, Move } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ClientConfig = () => {
  const { clients, updateClient, addTextPoint, updateTextPoint, deleteTextPoint } = useClient();
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("frames");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [newPoint, setNewPoint] = useState<Partial<TextPoint> | null>(null);

  const fontFamilies = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"];
  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72];
  const styleOptions = [
    { label: "Negrito", value: "bold" },
    { label: "Itálico", value: "italic" },
    { label: "Sublinhado", value: "underline" }
  ];

  // Load client data
  useEffect(() => {
    if (clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        setFramePreview(foundClient.frame);
        setFooterPreview(foundClient.footer);
        setLogoPreview(foundClient.logo);
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [clientId, clients, navigate]);

  // Handle file uploads
  const handleFileUpload = (type: 'frame' | 'footer' | 'logo', file: File) => {
    if (!client) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      switch (type) {
        case 'frame':
          setFramePreview(dataUrl);
          break;
        case 'footer':
          setFooterPreview(dataUrl);
          break;
        case 'logo':
          setLogoPreview(dataUrl);
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = () => {
    if (!client) return;
    
    updateClient(client.id, {
      frame: framePreview,
      footer: footerPreview,
      logo: logoPreview
    });
    
    toast({
      title: "Configurações salvas",
      description: "As configurações do cliente foram salvas com sucesso."
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!client || !canvasRef.current || activeTab !== "textPoints") return;
    
    // If we're in the middle of creating a new point, don't add another
    if (newPoint) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Create a new text point
    setNewPoint({
      x,
      y,
      name: "",
      fontFamily: "Arial",
      fontSize: 14,
      fontStyle: []
    });
  };

  const handleSaveNewPoint = () => {
    if (!client || !newPoint || !newPoint.name) return;
    
    addTextPoint(client.id, {
      name: newPoint.name,
      x: newPoint.x!,
      y: newPoint.y!,
      fontFamily: newPoint.fontFamily || "Arial",
      fontSize: newPoint.fontSize || 14,
      fontStyle: newPoint.fontStyle || []
    });
    
    setNewPoint(null);
    
    toast({
      title: "Campo adicionado",
      description: `O campo "${newPoint.name}" foi adicionado com sucesso.`
    });
  };

  const handleCancelNewPoint = () => {
    setNewPoint(null);
  };

  // Drag and drop functionality
  const handlePointMouseDown = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedPoint(pointId);
  };

  const handlePointMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedPoint || !canvasRef.current || !client) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Update point position
    updateTextPoint(client.id, draggedPoint, { x, y });
  };

  const handlePointMouseUp = () => {
    setIsDragging(false);
    setDraggedPoint(null);
  };

  const handleStyleChange = (pointId: string, style: string, checked: boolean) => {
    if (!client) return;
    
    const point = client.textPoints.find(p => p.id === pointId);
    if (!point) return;
    
    const newStyles = checked
      ? [...point.fontStyle, style]
      : point.fontStyle.filter(s => s !== style);
    
    updateTextPoint(client.id, pointId, { fontStyle: newStyles });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointMouseMove as any);
      window.addEventListener('mouseup', handlePointMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handlePointMouseMove as any);
        window.removeEventListener('mouseup', handlePointMouseUp);
      };
    }
  }, [isDragging]);

  if (!client) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-2xl font-bold">Configurar Cliente: {client.name}</h2>
        </div>
        <Button 
          onClick={handleSaveChanges}
          className="bg-gradient-to-r from-brand-DEFAULT to-brand-secondary"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar Alterações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="frames">Molduras e Rodapés</TabsTrigger>
          <TabsTrigger value="textPoints">Campos de Texto</TabsTrigger>
          <TabsTrigger value="preview">Visualização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="frames" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Moldura</h3>
                  <div className="space-y-2">
                    <Label htmlFor="frame">Faça upload da imagem de moldura (formato quadrado)</Label>
                    <Input
                      id="frame"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileUpload('frame', files[0]);
                        }
                      }}
                    />
                  </div>
                  {framePreview && (
                    <div className="aspect-square border rounded-md overflow-hidden">
                      <img 
                        src={framePreview} 
                        alt="Moldura" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Rodapé</h3>
                  <div className="space-y-2">
                    <Label htmlFor="footer">Faça upload da imagem de rodapé</Label>
                    <Input
                      id="footer"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileUpload('footer', files[0]);
                        }
                      }}
                    />
                  </div>
                  {footerPreview && (
                    <div className="border rounded-md overflow-hidden h-32">
                      <img 
                        src={footerPreview} 
                        alt="Rodapé" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Logo do Cliente</h3>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Faça upload do logo do cliente</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileUpload('logo', files[0]);
                        }
                      }}
                    />
                  </div>
                  {logoPreview && (
                    <div className="border rounded-md overflow-hidden h-32">
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="textPoints" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Posicionamento dos Campos de Texto</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Clique na imagem abaixo para adicionar pontos de texto. Arraste os pontos existentes para reposicioná-los.
                  </p>
                  <div 
                    ref={canvasRef}
                    className="canvas-container relative cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50"
                    onClick={handleCanvasClick}
                    onMouseUp={handlePointMouseUp}
                  >
                    {framePreview && (
                      <img 
                        src={framePreview} 
                        alt="Moldura" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" 
                      />
                    )}
                    
                    {client.textPoints.map((point, index) => (
                      <div key={point.id} className="absolute" style={{ 
                        left: `${point.x}%`, 
                        top: `${point.y}%`, 
                        transform: 'translate(-50%, -50%)',
                        zIndex: draggedPoint === point.id ? 20 : 10
                      }}>
                        <div 
                          className="admin-text-point"
                          onMouseDown={(e) => handlePointMouseDown(e, point.id)}
                        >
                          {index + 1}
                        </div>
                        <div className="admin-text-label">
                          {point.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Campos de Texto</h3>
                  
                  {client.textPoints.length === 0 && !newPoint && (
                    <p className="text-sm text-gray-500">
                      Nenhum campo de texto configurado. Clique na imagem para adicionar.
                    </p>
                  )}
                  
                  {client.textPoints.map((point, index) => (
                    <div key={point.id} className="p-3 border rounded-md relative">
                      <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{point.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => {
                            if (window.confirm(`Remover o campo "${point.name}"?`)) {
                              deleteTextPoint(client.id, point.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`font-${point.id}`} className="text-xs">Fonte</Label>
                            <Select
                              value={point.fontFamily}
                              onValueChange={(value) => updateTextPoint(client.id, point.id, { fontFamily: value })}
                            >
                              <SelectTrigger id={`font-${point.id}`} className="h-8">
                                <SelectValue placeholder="Selecione uma fonte" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontFamilies.map(font => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`size-${point.id}`} className="text-xs">Tamanho</Label>
                            <Select
                              value={point.fontSize.toString()}
                              onValueChange={(value) => updateTextPoint(client.id, point.id, { fontSize: parseInt(value) })}
                            >
                              <SelectTrigger id={`size-${point.id}`} className="h-8">
                                <SelectValue placeholder="Tamanho" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontSizes.map(size => (
                                  <SelectItem key={size} value={size.toString()}>
                                    {size}px
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 pt-1">
                          {styleOptions.map(option => (
                            <div key={option.value} className="flex items-center space-x-1">
                              <Checkbox 
                                id={`${option.value}-${point.id}`} 
                                checked={point.fontStyle.includes(option.value)}
                                onCheckedChange={(checked) => 
                                  handleStyleChange(point.id, option.value, !!checked)
                                }
                              />
                              <Label 
                                htmlFor={`${option.value}-${point.id}`}
                                className="text-xs cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {newPoint && (
                    <div className="p-3 border border-blue-300 rounded-md bg-blue-50">
                      <h4 className="font-medium text-blue-700 mb-2">Novo Campo</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="point-name" className="text-xs">Nome do Campo</Label>
                          <Input
                            id="point-name"
                            value={newPoint.name || ''}
                            onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                            placeholder="Ex: Nome do Projeto"
                            className="h-8"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="point-font" className="text-xs">Fonte</Label>
                            <Select
                              value={newPoint.fontFamily || 'Arial'}
                              onValueChange={(value) => setNewPoint({ ...newPoint, fontFamily: value })}
                            >
                              <SelectTrigger id="point-font" className="h-8">
                                <SelectValue placeholder="Selecione uma fonte" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontFamilies.map(font => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="point-size" className="text-xs">Tamanho</Label>
                            <Select
                              value={(newPoint.fontSize || '14').toString()}
                              onValueChange={(value) => setNewPoint({ ...newPoint, fontSize: parseInt(value) })}
                            >
                              <SelectTrigger id="point-size" className="h-8">
                                <SelectValue placeholder="Tamanho" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontSizes.map(size => (
                                  <SelectItem key={size} value={size.toString()}>
                                    {size}px
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 pt-1">
                          {styleOptions.map(option => (
                            <div key={option.value} className="flex items-center space-x-1">
                              <Checkbox 
                                id={`new-${option.value}`} 
                                checked={newPoint.fontStyle?.includes(option.value) || false}
                                onCheckedChange={(checked) => {
                                  const currentStyles = newPoint.fontStyle || [];
                                  const newStyles = checked
                                    ? [...currentStyles, option.value]
                                    : currentStyles.filter(s => s !== option.value);
                                  setNewPoint({ ...newPoint, fontStyle: newStyles });
                                }}
                              />
                              <Label 
                                htmlFor={`new-${option.value}`}
                                className="text-xs cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2 pt-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleSaveNewPoint}
                            disabled={!newPoint.name}
                          >
                            <Save className="h-3 w-3 mr-1" /> Salvar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNewPoint}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!newPoint && (
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                      onClick={() => handleCanvasClick({ clientX: 0, clientY: 0 } as any)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Campo
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Visualização</h3>
              <div className="flex flex-col items-center">
                <div className="canvas-container mb-4">
                  {framePreview && (
                    <img 
                      src={framePreview} 
                      alt="Moldura" 
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" 
                    />
                  )}
                  
                  {client.textPoints.map((point, index) => (
                    <div key={point.id} className="absolute z-20" style={{ 
                      left: `${point.x}%`, 
                      top: `${point.y}%`, 
                      transform: 'translate(-50%, -50%)'
                    }}>
                      <div 
                        className="admin-text-point"
                      >
                        {index + 1}
                      </div>
                      <div className="admin-text-label">
                        {point.name}
                      </div>
                    </div>
                  ))}
                  
                  {footerPreview && (
                    <img 
                      src={footerPreview} 
                      alt="Rodapé" 
                      className="absolute bottom-0 left-0 w-full object-contain pointer-events-none z-10" 
                      style={{ maxHeight: '30%' }}
                    />
                  )}
                </div>
                
                <div className="text-sm text-gray-500 max-w-md text-center">
                  Esta é uma pré-visualização de como ficará o gerador de imagens para este cliente.
                  O cliente poderá fazer upload de uma imagem para o fundo e preencher os campos de texto.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientConfig;
