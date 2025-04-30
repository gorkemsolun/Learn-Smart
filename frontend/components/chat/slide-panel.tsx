"use client";

import type React from "react";

import { Slide } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResizablePanel } from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Magnification constant
const MAGNIFICATION_CONSTANT = 100 / 38;

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
}: {
  imgSrc?: string;
  currentSlidePage: number;
  totalPages: number;
  isSlidesLoading: boolean;
  presentationFiles: { slide_id: string; slides_file_name: string }[];
  currentSlide: Slide;
  onFileChange: (slide_id: string) => void;
  onPreviousSlide: () => void;
  onNextSlide: () => void;
  fetchSlide: (slideID: string, pageNumber: number) => Promise<any>;
}) {
  // Core state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Dimensions
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // UI state
  const [userSlideInput, setUserSlideInput] = useState(
    currentSlidePage.toString()
  );

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Hooks
  const { toast } = useToast();

  // Reset state when slide changes
  useEffect(() => {
    // Don't set zoom level here, let handleImageLoad calculate it
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setUserSlideInput(currentSlidePage.toString());
  }, [currentSlidePage, currentSlide?.slide_id]);

  // Update container dimensions on mount and resize
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateContainerDimensions();
    window.addEventListener("resize", updateContainerDimensions);
    return () =>
      window.removeEventListener("resize", updateContainerDimensions);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle global mouse up for drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Keyboard shortcuts
  useHotkeys([
    {
      key: "ArrowLeft",
      callback: () => currentSlidePage > 1 && onPreviousSlide(),
    },
    {
      key: "ArrowRight",
      callback: () => currentSlidePage < totalPages && onNextSlide(),
    },
    { key: "y", metaKey: true, callback: () => handleZoom(10) },
    { key: "u", metaKey: true, callback: () => handleZoom(-10) },
    { key: "0", metaKey: true, callback: () => resetZoom() },
    { key: "f", metaKey: true, callback: () => toggleFullscreen() },
  ]);

  // Image load handler
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const { naturalWidth, naturalHeight } = imageRef.current;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Update container dimensions
    setContainerDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    // Calculate the zoom level needed to fit the image to the container
    // We want to find the scaling factor that makes the image fit within the container
    const widthRatio = containerWidth / naturalWidth;
    const heightRatio = containerHeight / naturalHeight;

    // Use the smaller ratio to ensure the entire image fits
    const fitZoomLevel = Math.floor(Math.min(widthRatio, heightRatio) * 100);

    // Apply a small margin to ensure it's fully visible (90% of the calculated fit)
    // and apply the magnification constant
    const safeZoomLevel = Math.min(
      Math.max(fitZoomLevel * 0.9 * MAGNIFICATION_CONSTANT, 10),
      300
    );

    // Set the initial zoom level to fit the image
    setZoomLevel(safeZoomLevel);
    setPosition({ x: 0, y: 0 });

    setImageLoaded(true);
  }, []);

  // Zoom handlers
  const handleZoom = useCallback(
    (delta: number) => {
      setZoomLevel((prev) => {
        const newZoom = Math.min(Math.max(prev + delta, 10), 300);

        // Calculate the base fit zoom level (for comparison)
        if (!imageRef.current || !containerRef.current) return newZoom;

        const { naturalWidth, naturalHeight } = imageRef.current;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const widthRatio = containerWidth / naturalWidth;
        const heightRatio = containerHeight / naturalHeight;
        const fitZoomLevel = Math.floor(
          Math.min(widthRatio, heightRatio) * 100 * 0.9 * MAGNIFICATION_CONSTANT
        );

        // If zooming out to fit level or below, reset position
        if (newZoom <= fitZoomLevel && prev > fitZoomLevel) {
          setPosition({ x: 0, y: 0 });
        } else if (newZoom > fitZoomLevel) {
          // When zooming in/out while already zoomed in, adjust position to maintain center focus
          const oldScale = prev / 100;
          const newScale = newZoom / 100;
          const scaleRatio = newScale / oldScale;

          // Adjust position to keep the center point fixed during zoom
          setPosition({
            x: position.x * scaleRatio,
            y: position.y * scaleRatio,
          });
        }

        return newZoom;
      });
    },
    [position]
  );

  const resetZoom = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    // Recalculate the fit zoom level
    const { naturalWidth, naturalHeight } = imageRef.current;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const widthRatio = containerWidth / naturalWidth;
    const heightRatio = containerHeight / naturalHeight;

    // Use the smaller ratio to ensure the entire image fits
    const fitZoomLevel = Math.floor(Math.min(widthRatio, heightRatio) * 100);

    // Apply a small margin to ensure it's fully visible (90% of the calculated fit)
    // and apply the magnification constant
    const safeZoomLevel = Math.min(
      Math.max(fitZoomLevel * 0.9 * MAGNIFICATION_CONSTANT, 10),
      300
    );

    setZoomLevel(safeZoomLevel);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Calculate the base fit zoom level for comparison
      if (!imageRef.current || !containerRef.current) return;

      const { naturalWidth, naturalHeight } = imageRef.current;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const widthRatio = containerWidth / naturalWidth;
      const heightRatio = containerHeight / naturalHeight;
      const fitZoomLevel = Math.floor(
        Math.min(widthRatio, heightRatio) * 100 * 0.9 * MAGNIFICATION_CONSTANT
      );

      // Only allow dragging if zoomed in beyond the fit level
      if (zoomLevel <= fitZoomLevel) return;

      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [zoomLevel, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      // Calculate new position
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate boundaries
      const scale = zoomLevel / 100;
      const scaledWidth = imageDimensions.width * scale;
      const scaledHeight = imageDimensions.height * scale;

      // Calculate the maximum allowed panning distance in each direction
      // This ensures the image can't be dragged beyond its visible area
      const maxX = Math.max(0, (scaledWidth - containerDimensions.width) / 2);
      const maxY = Math.max(0, (scaledHeight - containerDimensions.height) / 2);

      // Apply constraints
      const constrainedX = Math.min(Math.max(newX, -maxX), maxX);
      const constrainedY = Math.min(Math.max(newY, -maxY), maxY);

      setPosition({
        x: constrainedX,
        y: constrainedY,
      });
    },
    [isDragging, dragStart, zoomLevel, imageDimensions, containerDimensions]
  );

  // Slide input handlers
  const handleSlideInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserSlideInput(e.target.value);
    },
    []
  );

  const handleSlideSubmit = useCallback(() => {
    if (currentSlidePage.toString() === userSlideInput) {
      return;
    }
    const slideNumber = Number.parseInt(userSlideInput, 10);
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
  }, [
    userSlideInput,
    totalPages,
    currentSlide?.slide_id,
    fetchSlide,
    toast,
    currentSlidePage,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;

        setContainerDimensions({
          width: newWidth,
          height: newHeight,
        });

        // If image is loaded, recalculate the fit zoom level
        if (imageRef.current && imageLoaded) {
          const { naturalWidth, naturalHeight } = imageRef.current;
          const widthRatio = newWidth / naturalWidth;
          const heightRatio = newHeight / naturalHeight;
          const fitZoomLevel = Math.floor(
            Math.min(widthRatio, heightRatio) *
              100 *
              0.9 *
              MAGNIFICATION_CONSTANT
          );

          // If zoomed in, recalculate position constraints
          if (zoomLevel > fitZoomLevel) {
            const scale = zoomLevel / 100;
            const scaledWidth = imageDimensions.width * scale;
            const scaledHeight = imageDimensions.height * scale;

            const maxX = Math.max(0, (scaledWidth - newWidth) / 2);
            const maxY = Math.max(0, (scaledHeight - newHeight) / 2);

            // Ensure position stays within bounds after resize
            setPosition((prev) => ({
              x: Math.min(Math.max(prev.x, -maxX), maxX),
              y: Math.min(Math.max(prev.y, -maxY), maxY),
            }));
          } else {
            // If at or below fit level, reset position
            setPosition({ x: 0, y: 0 });
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [zoomLevel, imageDimensions, imageLoaded]);

  return (
    <ResizablePanel defaultSize={50} minSize={30}>
      <div className="flex h-full flex-col">
        {/* Header: File selection and controls */}
        <div className="flex items-center justify-between border-b p-1">
          <div className="flex items-center gap-2">
            <Select
              value={currentSlide?.slide_id}
              onValueChange={onFileChange}
              className="mt-2"
            >
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Choose File" />
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
                    disabled={zoomLevel <= 10 || isSlidesLoading}
                    aria-label="Zoom out"
                    className="size-8"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (Cmd + u)</TooltipContent>
              </Tooltip>

              <span className="w-16 text-center text-sm tabular-nums">{`${zoomLevel.toFixed(1)}%`}</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleZoom(10)}
                    disabled={zoomLevel >= 300 || isSlidesLoading}
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
                    disabled={isSlidesLoading}
                    aria-label="Reset zoom"
                    className="size-8"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset zoom (Cmd + 0)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    aria-label={
                      isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                    }
                    className="size-8"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen (Cmd + f)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Slide Content */}
        <div className="relative flex flex-1 flex-col items-center overflow-hidden p-3">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-base font-semibold">
              Slide {currentSlidePage}
            </h2>

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
                  onChange={handleSlideInputChange}
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
                      disabled={
                        isSlidesLoading || currentSlidePage >= totalPages
                      }
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
            ref={containerRef}
            className="relative flex size-full flex-1 items-center justify-center overflow-hidden rounded-lg border bg-background/50 shadow-sm"
          >
            {isSlidesLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading slide...
                </p>
              </div>
            ) : imgSrc ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-4 rounded-md" />
                )}
                <div
                  className={cn(
                    "relative flex size-full items-center justify-center",
                    zoomLevel > 100 && "cursor-grab",
                    isDragging && zoomLevel > 100 && "cursor-grabbing"
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <div
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel / 100})`,
                      transformOrigin: "center",
                      transition: isDragging
                        ? "none"
                        : "transform 0.1s ease-out",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={imgSrc || "/placeholder.svg"}
                      alt={`Presentation Slide ${currentSlidePage}`}
                      className={cn(
                        "max-h-full max-w-full object-contain",
                        !imageLoaded && "opacity-0",
                        imageLoaded &&
                          "opacity-100 transition-opacity duration-200"
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
                  <p className="text-sm text-muted-foreground">
                    Please select a presentation file to begin
                  </p>
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
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      ← →
                    </kbd>{" "}
                    for navigation
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
