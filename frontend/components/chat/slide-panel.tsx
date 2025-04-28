"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/ui/resizable";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ZoomIn, ZoomOut, Loader2, Maximize2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useHotkeys } from "@/hooks/use-hotkeys";
import type { SlidePanelProps } from "@/app/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {useToast} from "@/hooks/use-toast";

export default function SlidePanel({
  imgSrc,
  currentSlidePage,
  totalPages,
  isSlidesLoading,
  presentationFiles,
  currentSlide,
  onFileChange,
  onPreviousSlide,
  onNextSlide,
  fetchSlide,
}: SlidePanelProps) {
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [fitToScreen, setFitToScreen] = useState(true);
  // Add a new state to track the fit-to-screen zoom level
  const [fitToScreenZoomLevel, setFitToScreenZoomLevel] = useState<number | null>(null);

  const slideContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [userSlideInput, setUserSlideInput] = useState(currentSlidePage.toString());
  const { toast } = useToast();

  const handleSlideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSlideInput(e.target.value);
  };

  const handleSlideSubmit = () => {
    const slideNumber = parseInt(userSlideInput, 10);
    if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > totalPages) {
      toast({
        title: "Invalid slide number",
        description: `Please enter a number between 1 and ${totalPages}`,
        variant: "destructive",
      });
      setUserSlideInput(currentSlidePage.toString());
      return;
    }
    fetchSlide(currentSlide.slide_id, slideNumber);
  };

  // Setup keyboard shortcuts
  useHotkeys([
    { key: "ArrowLeft", callback: () => currentSlidePage > 1 && onPreviousSlide() },
    { key: "ArrowRight", callback: () => currentSlidePage < totalPages && onNextSlide() },
    { key: "y", metaKey: true, callback: () => handleZoom(10) },
    { key: "u", metaKey: true, callback: () => handleZoom(-10) },
    { key: "0", metaKey: true, callback: () => resetZoom() },
    { key: "f", metaKey: true, callback: () => toggleFullscreen() },
  ]);

  // Reset zoom level and position when slide changes
  useEffect(() => {
    resetZoom();
    setImageLoaded(false);
    setFitToScreen(true);
  }, [currentSlidePage, currentSlide?.slide_id]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (slideContainerRef.current) {
        const { clientWidth, clientHeight } = slideContainerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateContainerDimensions();
    window.addEventListener("resize", updateContainerDimensions);

    return () => {
      window.removeEventListener("resize", updateContainerDimensions);
    };
  }, []);

  // Calculate appropriate zoom level when image loads
  const handleImageLoad = () => {
    setImageLoaded(true);

    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });

      // Calculate the appropriate zoom level
      calculateFitToScreenZoom();
    }
  };

  const resetZoom = () => {
    setPosition({ x: 0, y: 0 });
    setFitToScreen(true);
    calculateFitToScreenZoom();
  };

  // Update the handleZoom function to set fitToScreen to false only when zooming away from the fit level
  const handleZoom = (amount: number) => {
    setZoomLevel((prev) => {
      const currentZoom = prev ?? 100;
      const newZoom = Math.min(Math.max(currentZoom + amount, 10), 300);

      // If the new zoom level is different from the fit-to-screen level, we're no longer fitting to screen
      if (newZoom !== fitToScreenZoomLevel) {
        setFitToScreen(false);
      }

      // If zooming out to fit-to-screen level or below, reset position
      if (newZoom <= (fitToScreenZoomLevel ?? 100) && currentZoom > (fitToScreenZoomLevel ?? 100)) {
        setPosition({ x: 0, y: 0 });
      }

      return newZoom;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Update the handleMouseDown function to check against the fit-to-screen zoom level
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging if we're zoomed in beyond the fit-to-screen level
    if (zoomLevel !== null && fitToScreenZoomLevel !== null && zoomLevel <= fitToScreenZoomLevel) return;

    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    // Calculate boundaries to prevent dragging outside of visible area
    if (imageRef.current && slideContainerRef.current) {
      const scaledWidth = imageDimensions.width * ((zoomLevel ?? 100) / 100);
      const scaledHeight = imageDimensions.height * ((zoomLevel ?? 100) / 100);

      const containerWidth = containerDimensions.width;
      const containerHeight = containerDimensions.height;

      // Calculate the maximum allowed drag in each direction
      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

      // Constrain the position within the boundaries
      const constrainedX = Math.min(Math.max(newX, -maxX), maxX);
      const constrainedY = Math.min(Math.max(newY, -maxY), maxY);

      setPosition({
        x: constrainedX,
        y: constrainedY,
      });
    } else {
      setPosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Clean up mouse events when component unmounts
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    setUserSlideInput(currentSlidePage.toString());
  }, [currentSlidePage]);

  // Update the calculateFitToScreenZoom function to store the fit-to-screen zoom level
  const calculateFitToScreenZoom = () => {
    if (imageRef.current && slideContainerRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      const containerWidth = slideContainerRef.current.clientWidth;
      const containerHeight = slideContainerRef.current.clientHeight;

      const widthRatio = containerWidth / naturalWidth;
      const heightRatio = containerHeight / naturalHeight;

      // Use the smaller ratio to ensure the image fits within the container
      const fitRatio = Math.min(widthRatio, heightRatio, 1);
      const calculatedZoom = Math.floor(fitRatio * 100);

      setFitToScreenZoomLevel(calculatedZoom);
      setZoomLevel(calculatedZoom);
    } else {
      // If we can't calculate yet, use a reasonable default
      setFitToScreenZoomLevel(100);
      setZoomLevel(100);
    }
  };

  return (
    <ResizablePanel defaultSize={50} minSize={30}>
      <div className="flex h-full flex-col">
        {/* Header: Sidebar toggle, file selection, and controls */}
        <div className="flex items-center justify-between border-b p-1">
          <div className="flex items-center gap-2">
            <Select onValueChange={onFileChange} className="mt-2">
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Choose File"/>
              </SelectTrigger>
              <SelectContent>
                {presentationFiles.map((file) => (
                    <SelectItem key={file.slide_id} value={file.slide_id}>
                      {file.slides_file_name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleZoom(-10)}
                      disabled={zoomLevel === null || zoomLevel <= 10 || isSlidesLoading}
                      aria-label="Zoom out"
                      className="size-8"
                  >
                    <ZoomOut className="size-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (Cmd + u)</TooltipContent>
              </Tooltip>

              <span className="w-16 text-center text-sm tabular-nums">
                {zoomLevel !== null ? `${zoomLevel}%` : "..."}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleZoom(10)}
                    disabled={zoomLevel === null || zoomLevel >= 300 || isSlidesLoading}
                    aria-label="Zoom in"
                    className="size-8"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in (Cmd + y)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetZoom}
                    disabled={zoomLevel === 100 && position.x === 0 && position.y === 0}
                    aria-label="Reset zoom"
                    className="size-8"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset zoom (Cmd 0)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    className="size-8"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen (Cmd + F)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Slide Content */}
        <div className="relative flex flex-1 flex-col items-center overflow-hidden p-3">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-base font-semibold">Slide {currentSlidePage}</h2>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onPreviousSlide}
                      disabled={isSlidesLoading || currentSlidePage <= 1}
                      aria-label="Previous slide"
                      className="size-8"
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous slide (←)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center space-x-1">
                <input
                    type="number"
                    value={userSlideInput}
                    onChange={handleSlideChange}
                    onBlur={handleSlideSubmit}
                    onKeyDown={(e) => e.key === "Enter" && handleSlideSubmit()}
                    className="w-auto rounded-md border bg-transparent text-center text-sm focus:outline-none focus:ring-0"
                    min={1}
                    max={totalPages}
                />
                <span className="text-sm">/ {totalPages}</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNextSlide}
                        disabled={isSlidesLoading || currentSlidePage >= totalPages}
                        aria-label="Next slide"
                        className="size-8"
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next slide (→)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Progress bar */}
          <Progress
            value={(currentSlidePage / totalPages) * 100}
            className="mb-4 h-1 w-full"
            aria-label={`Slide ${currentSlidePage} of ${totalPages}`}
          />

          {/* Slide container */}
          <div
              ref={slideContainerRef}
              className="relative flex size-full flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background/50 shadow-sm"
          >
            {isSlidesLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8">
                  <Loader2 className="size-8 animate-spin text-primary"/>
                  <p className="text-sm text-muted-foreground">Loading slide...</p>
                </div>
            ) : imgSrc ? (
                <>
                  {!imageLoaded && <Skeleton className="absolute inset-4 rounded-md"/>}
                  <div
                      className={cn(
                          "relative w-full h-full flex items-center justify-center",
                          zoomLevel > 100 && "cursor-grab",
                          isDragging && zoomLevel > 100 && "cursor-grabbing",
                      )}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                  >
                    <div
                        className="transition-transform duration-100"
                        style={{
                          transform: `translate(${position.x}px, ${position.y}px) scale(${(zoomLevel ?? 100) / 100})`,
                          transformOrigin: "center center",
                        }}
                    >
                      <img
                          ref={imageRef}
                          src={imgSrc || "/placeholder.svg"}
                          alt={`Presentation Slide ${currentSlidePage}`}
                          className={cn(
                              "max-h-full max-w-full transition-opacity duration-200",
                              !imageLoaded && "opacity-0",
                          )}
                          onLoad={handleImageLoad}
                          draggable={false}
                          crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <p className="text-muted-foreground">No slide available</p>
                  {presentationFiles.length === 0 && (
                      <p className="text-sm text-muted-foreground">Please select a presentation file to begin</p>
                  )}
                </div>
            )}
          </div>

          {/* Bottom navigation controls */}
          <div className="mt-4 flex w-full justify-center">
            <div className="text-sm text-muted-foreground">
              {!isSlidesLoading && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <div>
                      <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-semibold">← →</kbd> for navigation
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResizablePanel>
  );
}

