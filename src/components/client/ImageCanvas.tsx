
import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { TextPoint } from "@/contexts/ClientContext";

interface ImageCanvasProps {
  backgroundImage: string | null;
  frameImage: string | null;
  footerImage: string | null;
  textPoints: TextPoint[];
  textValues: { [key: string]: string };
}

const ImageCanvas = forwardRef<HTMLCanvasElement, ImageCanvasProps>(
  ({ backgroundImage, frameImage, footerImage, textPoints, textValues }, ref) => {
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);
    const [lastDist, setLastDist] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [backgroundImageObj, setBackgroundImageObj] = useState<HTMLImageElement | null>(null);
    
    // Initialize canvas
    useEffect(() => {
      const canvasElement = document.createElement('canvas');
      const context = canvasElement.getContext('2d');
      
      if (context) {
        canvasElement.width = 1000;
        canvasElement.height = 1000;
        canvasElement.style.width = '100%';
        canvasElement.style.height = '100%';
        
        setCanvas(canvasElement);
        setCtx(context);
      }
    }, []);
    
    // Expose canvas to parent component for download
    useImperativeHandle(ref, () => canvas as HTMLCanvasElement);
    
    // Pre-load background image to prevent flickering
    useEffect(() => {
      if (backgroundImage && !backgroundImageObj) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImageObj(img);
          setImageLoaded(true);
        };
        img.src = backgroundImage;
      } else if (!backgroundImage) {
        setBackgroundImageObj(null);
        setImageLoaded(false);
      }
    }, [backgroundImage]);
    
    // Reset position when a new image is loaded
    useEffect(() => {
      if (backgroundImageObj) {
        // Center the image when it's loaded
        centerImage(backgroundImageObj);
      }
    }, [backgroundImageObj]);
    
    // Center the image function
    const centerImage = useCallback((img?: HTMLImageElement) => {
      if (!canvas || !ctx) return;
      
      const imgToUse = img || backgroundImageObj;
      if (!imgToUse) return;
      
      // Calculate size to fit the image in the canvas
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = imgToUse.width / imgToUse.height;
      
      let newScale = 1;
      let newOffsetX = 0;
      let newOffsetY = 0;
      
      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        newScale = canvas.width / imgToUse.width * 0.9;
      } else {
        // Image is taller than canvas
        newScale = canvas.height / imgToUse.height * 0.9;
      }
      
      // Center the image
      newOffsetX = (canvas.width - imgToUse.width * newScale) / 2;
      newOffsetY = (canvas.height - imgToUse.height * newScale) / 2;
      
      setScale(newScale);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
      
      // Redraw with new parameters
      setIsRendering(false);
      drawCanvas();
    }, [canvas, ctx, backgroundImageObj]);
    
    // Drawing function with optimizations to prevent flickering
    const drawCanvas = useCallback(() => {
      if (!ctx || !canvas || isRendering) return;
      
      setIsRendering(true);
      
      // Clear canvas with a solid background instead of transparent
      ctx.fillStyle = "#f3f4f6"; // Light gray background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const drawRemainingLayers = () => {
        // Draw frame image
        if (frameImage) {
          const frameImg = new Image();
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            
            // Draw footer after frame if needed
            if (footerImage) {
              const footerImg = new Image();
              footerImg.onload = () => {
                // Draw footer at the bottom
                const footerHeight = (footerImg.height / footerImg.width) * canvas.width;
                ctx.drawImage(
                  footerImg, 
                  0, 
                  canvas.height - footerHeight,
                  canvas.width,
                  footerHeight
                );
                
                // Draw text points
                drawTextPoints();
                setIsRendering(false);
              };
              footerImg.src = footerImage;
            } else {
              // No footer, just draw text points
              drawTextPoints();
              setIsRendering(false);
            }
          };
          frameImg.src = frameImage;
        } else if (footerImage) {
          // No frame, but draw footer
          const footerImg = new Image();
          footerImg.onload = () => {
            const footerHeight = (footerImg.height / footerImg.width) * canvas.width;
            ctx.drawImage(
              footerImg, 
              0, 
              canvas.height - footerHeight,
              canvas.width,
              footerHeight
            );
            
            // Draw text points
            drawTextPoints();
            setIsRendering(false);
          };
          footerImg.src = footerImage;
        } else {
          // No frame or footer, just draw text points
          drawTextPoints();
          setIsRendering(false);
        }
      };
      
      // Draw background image if available
      if (backgroundImageObj && imageLoaded) {
        // Use the cached background image to prevent flickering
        ctx.save();
        ctx.drawImage(
          backgroundImageObj, 
          offsetX, 
          offsetY, 
          backgroundImageObj.width * scale, 
          backgroundImageObj.height * scale
        );
        ctx.restore();
        drawRemainingLayers();
      } else if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImageObj(img);
          ctx.save();
          ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
          ctx.restore();
          drawRemainingLayers();
        };
        img.src = backgroundImage;
      } else {
        // No background image
        drawRemainingLayers();
      }
    }, [canvas, ctx, backgroundImage, frameImage, footerImage, scale, offsetX, offsetY, textPoints, textValues, isRendering, backgroundImageObj, imageLoaded]);
    
    // Draw text points
    const drawTextPoints = useCallback(() => {
      if (!ctx || !canvas) return;
      
      textPoints.forEach(point => {
        const text = textValues[point.id] || "";
        if (!text) return;
        
        // Configure text style
        ctx.save();
        ctx.font = `${
          point.fontStyle.includes('italic') ? 'italic ' : ''
        }${
          point.fontStyle.includes('bold') ? 'bold ' : ''
        }${point.fontSize}px ${point.fontFamily}`;
        
        // Use point.color if available, otherwise default to black
        ctx.fillStyle = point.color || "#000000";
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Calculate position based on percentages
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / 100) * canvas.height;
        
        // Draw text
        ctx.fillText(text, x, y);
        
        // Draw underline if needed
        if (point.fontStyle.includes('underline') && text) {
          const textWidth = ctx.measureText(text).width;
          const lineY = y + (point.fontSize / 2);
          
          ctx.beginPath();
          ctx.moveTo(x - textWidth / 2, lineY);
          ctx.lineTo(x + textWidth / 2, lineY);
          ctx.strokeStyle = point.color || "#000000";
          ctx.lineWidth = point.fontSize / 20;
          ctx.stroke();
        }
        
        ctx.restore();
      });
    }, [canvas, ctx, textPoints, textValues]);
    
    // Redraw when dependencies change
    useEffect(() => {
      if (!isRendering) {
        drawCanvas();
      }
    }, [drawCanvas, isRendering]);
    
    // Mouse and touch event handlers with modifications to prevent page scrolling
    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setLastX(e.clientX - rect.left);
      setLastY(e.clientY - rect.top);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Scale delta by canvas size
      const canvasScale = canvas ? canvas.width / (e.target as HTMLElement).clientWidth : 1;
      const deltaX = (x - lastX) * canvasScale;
      const deltaY = (y - lastY) * canvasScale;
      
      setOffsetX(prev => prev + deltaX);
      setOffsetY(prev => prev + deltaY);
      setLastX(x);
      setLastY(y);
      
      // Redraw with new position
      setIsRendering(false);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault(); // Prevent page scrolling
      e.stopPropagation(); // Stop event propagation
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate canvas coordinates
      const canvasScale = canvas ? canvas.width / rect.width : 1;
      const canvasX = mouseX * canvasScale;
      const canvasY = mouseY * canvasScale;
      
      // Adjust scale based on wheel direction (zoom in/out)
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = scale * scaleFactor;
      
      // Limit zoom
      if (newScale < 0.1 || newScale > 5) return;
      
      // Adjust offset to zoom towards cursor position
      const newOffsetX = canvasX - (canvasX - offsetX) * (newScale / scale);
      const newOffsetY = canvasY - (canvasY - offsetY) * (newScale / scale);
      
      setScale(newScale);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
      
      // Redraw with new scale and position
      setIsRendering(false);
    };
    
    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      
      if (e.touches.length === 1) {
        // Single touch for dragging
        setIsDragging(true);
        setLastX(e.touches[0].clientX - rect.left);
        setLastY(e.touches[0].clientY - rect.top);
      } else if (e.touches.length === 2) {
        // Two touches for pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        setLastDist(distance);
        
        // Calculate center point between touches
        const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
        const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
        setLastX(centerX);
        setLastY(centerY);
      }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      
      if (e.touches.length === 1 && isDragging) {
        // Single touch drag
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        // Scale delta by canvas size
        const canvasScale = canvas ? canvas.width / rect.width : 1;
        const deltaX = (x - lastX) * canvasScale;
        const deltaY = (y - lastY) * canvasScale;
        
        setOffsetX(prev => prev + deltaX);
        setOffsetY(prev => prev + deltaY);
        setLastX(x);
        setLastY(y);
        
        setIsRendering(false);
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        // Calculate scale change
        const scaleFactor = distance / lastDist;
        const newScale = scale * scaleFactor;
        
        // Limit zoom
        if (newScale >= 0.1 && newScale <= 5) {
          // Calculate center point between touches
          const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
          const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
          
          // Convert to canvas coordinates
          const canvasScale = canvas ? canvas.width / rect.width : 1;
          const canvasX = centerX * canvasScale;
          const canvasY = centerY * canvasScale;
          
          // Adjust offset to zoom towards center
          const newOffsetX = canvasX - (canvasX - offsetX) * (newScale / scale);
          const newOffsetY = canvasY - (canvasY - offsetY) * (newScale / scale);
          
          setScale(newScale);
          setOffsetX(newOffsetX);
          setOffsetY(newOffsetY);
          
          // Update for next move
          setLastDist(distance);
          setLastX(centerX);
          setLastY(centerY);
          
          setIsRendering(false);
        }
      }
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    if (!canvas) {
      return <div className="w-full h-full bg-gray-200 animate-pulse"></div>;
    }
    
    return (
      <div 
        className="w-full h-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {canvas && (
          <canvas 
            ref={node => node && node !== canvas && node.parentNode?.replaceChild(canvas, node)} 
            className="w-full h-full" 
          />
        )}
      </div>
    );
  }
);

ImageCanvas.displayName = "ImageCanvas";

export default ImageCanvas;
