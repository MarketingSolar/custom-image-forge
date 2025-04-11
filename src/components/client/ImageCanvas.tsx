
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
    
    // Drawing function
    const drawCanvas = useCallback(() => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background image if available
      if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          // Calculate scaled dimensions and position
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          ctx.save();
          ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.restore();
          
          // Draw frame and other elements
          drawFrameAndText();
        };
        img.src = backgroundImage;
      } else {
        // No background image, just draw frame and text
        drawFrameAndText();
      }
    }, [canvas, ctx, backgroundImage, frameImage, footerImage, scale, offsetX, offsetY, textPoints, textValues]);
    
    // Draw frame, footer, and text
    const drawFrameAndText = useCallback(() => {
      if (!ctx || !canvas) return;
      
      // Draw frame image
      if (frameImage) {
        const frameImg = new Image();
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          
          // Draw footer after frame
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
            };
            footerImg.src = footerImage;
          } else {
            // No footer, just draw text points
            drawTextPoints();
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
        };
        footerImg.src = footerImage;
      } else {
        // No frame or footer, just draw text points
        drawTextPoints();
      }
    }, [canvas, ctx, frameImage, footerImage, textPoints, textValues]);
    
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
      drawCanvas();
    }, [drawCanvas]);
    
    // Mouse and touch event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!backgroundImage) return;
      
      setIsDragging(true);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setLastX(e.clientX - rect.left);
      setLastY(e.clientY - rect.top);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !backgroundImage) return;
      
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
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault(); // Prevent page scrolling
      e.stopPropagation(); // Stop event propagation
      
      if (!backgroundImage) return;
      
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
    };
    
    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      if (!backgroundImage) return;
      
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
      if (!backgroundImage) return;
      
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
        className="w-full h-full"
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
