
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
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
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
  
  // Text color options
  const colorOptions = [
    { label: "Preto", value: "#000000" },
    { label: "Branco", value: "#FFFFFF" },
    { label: "Vermelho", value: "#FF0000" },
    { label: "Verde", value: "#008000" },
    { label: "Azul", value: "#0000FF" },
    { label: "Amarelo", value: "#FFFF00" },
    { label: "Laranja", value: "#FFA500" },
    { label: "Roxo", value: "#800080" },
    { label: "Rosa", value: "#FFC0CB" },
    { label: "Marrom", value: "#A52A2A" },
    { label: "Cinza", value: "#808080" },
  ];

  // Load client data
  useEffect(() => {
    if (clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        setFramePreview(foundClient.frame);
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [clientId, clients, navigate]);

  // Handle file uploads
  const handleFileUpload = (type: 'frame', file: File) => {
    if (!client) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      if (type === 'frame') {
        setFramePreview(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = () => {
    if (!client) return;
    
    updateClient(client.id, {
      frame: framePreview,
      footer: null
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
      fontStyle: [],
      color: "#000000"
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
      fontStyle: newPoint.fontStyle || [],
      color: newPoint.color || "#000000"
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

  const handlePositionChange = (pointId: string, axis: 'x' | 'y', value: string) => {
    if (!client) return;
    
    // Convert string to number and ensure it's within 0-100 range
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    numValue = Math.min(Math.max(numValue, 0), 100);
    
    updateTextPoint(client.id, pointId, { [axis]: numValue });
  };
  
  const handleNewPointPositionChange = (axis: 'x' | 'y', value: string) => {
    if (!newPoint) return;
    
    // Convert string to number and ensure it's within 0-100 range
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    numValue = Math.min(Math.max(numValue, 0), 100);
    
    setNewPoint({ ...newPoint, [axis]: numValue });
  };

  const handleStyleChange = (pointId: string, style: string, checked: boolean) => {
    if (!client) return;
    
    const point = client.textPoints.find(p => p.id === pointId);
    if (!point) return;
    
    let newStyles = [...point.fontStyle];
    
    if (checked) {
      // Only add if not already present
      if (!newStyles.includes(style)) {
        newStyles.push(style);
      }
    } else {
      // Remove style
      newStyles = newStyles.filter(s => s !== style);
    }
    
    updateTextPoint(client.id, pointId, { fontStyle: newStyles });
  };
  
  // Fixed version of style handling for new points
  const handleNewPointStyleChange = (style: string, checked: boolean) => {
    if (!newPoint) return;
    
    const currentStyles = newPoint.fontStyle || [];
    let updatedStyles = [...currentStyles];
    
    if (checked && !updatedStyles.includes(style)) {
      updatedStyles.push(style);
    } else if (!checked && updatedStyles.includes(style)) {
      updatedStyles = updatedStyles.filter(s => s !== style);
    }
    
    setNewPoint({ ...newPoint, fontStyle: updatedStyles });
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
            className="text-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">Configurar Cliente: {client.name}</h2>
        </div>
        <Button 
          onClick={handleSaveChanges}
          className="bg-primary text-white"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar Alterações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="border-gray-200 bg-white rounded-lg shadow-sm">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-t-lg p-1">
          <TabsTrigger value="frames" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Moldura</TabsTrigger>
          <TabsTrigger value="textPoints" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Campos de Texto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="frames" className="space-y-4 pt-4 p-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Moldura</h3>
                <div className="space-y-2">
                  <Label htmlFor="frame" className="text-gray-700">Faça upload da imagem de moldura (formato quadrado)</Label>
                  <Input
                    id="frame"
                    type="file"
                    accept="image/*"
                    className="border-gray-300"
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
        </TabsContent>
        
        <TabsContent value="textPoints" className="space-y-4 pt-4 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full shadow-sm border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Posicionamento dos Campos de Texto</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Clique na imagem abaixo para adicionar pontos de texto. Arraste os pontos existentes para reposicioná-los.
                  </p>
                  <div 
                    ref={canvasRef}
                    className="canvas-container relative cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50"
                    onClick={handleCanvasClick}
                    onMouseUp={handlePointMouseUp}
                  >
                    {framePreview ? (
                      <img 
                        src={framePreview} 
                        alt="Moldura" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <p>Faça upload de uma moldura primeiro</p>
                      </div>
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
                          style={{
                            backgroundColor: point.color || "#0000FF"
                          }}
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
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Campos de Texto</h3>
                  
                  {client.textPoints.length === 0 && !newPoint && (
                    <p className="text-sm text-gray-500">
                      Nenhum campo de texto configurado. Clique na imagem para adicionar.
                    </p>
                  )}
                  
                  {client.textPoints.map((point, index) => (
                    <div key={point.id} className="p-3 border rounded-md relative border-gray-200 bg-gray-50">
                      <div className="absolute -top-2 -left-2 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        style={{ backgroundColor: point.color || "#0000FF" }}>
                        {index + 1}
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-gray-800">{point.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
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
                        {/* Position X and Y input fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`x-${point.id}`} className="text-xs text-gray-700">Posição X (%)</Label>
                            <Input
                              id={`x-${point.id}`}
                              value={point.x.toFixed(2)}
                              onChange={(e) => handlePositionChange(point.id, 'x', e.target.value)}
                              className="h-8 border-gray-300"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`y-${point.id}`} className="text-xs text-gray-700">Posição Y (%)</Label>
                            <Input
                              id={`y-${point.id}`}
                              value={point.y.toFixed(2)}
                              onChange={(e) => handlePositionChange(point.id, 'y', e.target.value)}
                              className="h-8 border-gray-300"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`font-${point.id}`} className="text-xs text-gray-700">Fonte</Label>
                            <Select
                              value={point.fontFamily}
                              onValueChange={(value) => updateTextPoint(client.id, point.id, { fontFamily: value })}
                            >
                              <SelectTrigger id={`font-${point.id}`} className="h-8 border-gray-300">
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
                            <Label htmlFor={`size-${point.id}`} className="text-xs text-gray-700">Tamanho</Label>
                            <Select
                              value={point.fontSize.toString()}
                              onValueChange={(value) => updateTextPoint(client.id, point.id, { fontSize: parseInt(value) })}
                            >
                              <SelectTrigger id={`size-${point.id}`} className="h-8 border-gray-300">
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
                        
                        <div>
                          <Label htmlFor={`color-${point.id}`} className="text-xs text-gray-700">Cor do Texto</Label>
                          <Select
                            value={point.color || "#000000"}
                            onValueChange={(value) => updateTextPoint(client.id, point.id, { color: value })}
                          >
                            <SelectTrigger id={`color-${point.id}`} className="h-8 border-gray-300">
                              <SelectValue placeholder="Selecione uma cor">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                    style={{ backgroundColor: point.color || "#000000" }}
                                  />
                                  {colorOptions.find(c => c.value === (point.color || "#000000"))?.label || "Cor personalizada"}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map(color => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label 
                                htmlFor={`${option.value}-${point.id}`}
                                className="text-xs cursor-pointer text-gray-700"
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
                          <Label htmlFor="point-name" className="text-xs text-gray-700">Nome do Campo</Label>
                          <Input
                            id="point-name"
                            value={newPoint.name || ''}
                            onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                            placeholder="Ex: Nome do Projeto"
                            className="h-8 border-gray-300"
                          />
                        </div>
                        
                        {/* Position X and Y input fields for new point */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="point-x" className="text-xs text-gray-700">Posição X (%)</Label>
                            <Input
                              id="point-x"
                              value={newPoint.x?.toFixed(2) || '0'}
                              onChange={(e) => handleNewPointPositionChange('x', e.target.value)}
                              className="h-8 border-gray-300"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="point-y" className="text-xs text-gray-700">Posição Y (%)</Label>
                            <Input
                              id="point-y"
                              value={newPoint.y?.toFixed(2) || '0'}
                              onChange={(e) => handleNewPointPositionChange('y', e.target.value)}
                              className="h-8 border-gray-300"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="point-font" className="text-xs text-gray-700">Fonte</Label>
                            <Select
                              value={newPoint.fontFamily || 'Arial'}
                              onValueChange={(value) => setNewPoint({ ...newPoint, fontFamily: value })}
                            >
                              <SelectTrigger id="point-font" className="h-8 border-gray-300">
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
                            <Label htmlFor="point-size" className="text-xs text-gray-700">Tamanho</Label>
                            <Select
                              value={(newPoint.fontSize || '14').toString()}
                              onValueChange={(value) => setNewPoint({ ...newPoint, fontSize: parseInt(value) })}
                            >
                              <SelectTrigger id="point-size" className="h-8 border-gray-300">
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
                        
                        <div>
                          <Label htmlFor="point-color" className="text-xs text-gray-700">Cor do Texto</Label>
                          <Select
                            value={newPoint.color || '#000000'}
                            onValueChange={(value) => setNewPoint({ ...newPoint, color: value })}
                          >
                            <SelectTrigger id="point-color" className="h-8 border-gray-300">
                              <SelectValue placeholder="Selecione uma cor">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                    style={{ backgroundColor: newPoint.color || "#000000" }}
                                  />
                                  {colorOptions.find(c => c.value === (newPoint.color || "#000000"))?.label || "Cor personalizada"}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map(color => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 pt-1">
                          {styleOptions.map(option => (
                            <div key={option.value} className="flex items-center space-x-1">
                              <Checkbox 
                                id={`new-${option.value}`} 
                                checked={newPoint.fontStyle?.includes(option.value) || false}
                                onCheckedChange={(checked) => handleNewPointStyleChange(option.value, !!checked)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label 
                                htmlFor={`new-${option.value}`}
                                className="text-xs cursor-pointer text-gray-700"
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
                            className="bg-blue-500 hover:bg-blue-600 text-white"
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
                            className="border-gray-300 text-gray-700"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!newPoint && framePreview && (
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
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
      </Tabs>
    </div>
  );
};

export default ClientConfig;
