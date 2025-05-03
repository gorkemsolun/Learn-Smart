"use client";

import type {NodeData, EdgeData, SkillTree as SkillTreeType} from "@/app/types";
import NodeDetailsModal from "@/components/skill-tree/node-details-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { Home, Info, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "next-themes";
import {useCallback, useEffect, useRef, useState} from "react";
import { skillTreeService } from "@/environment/backend_api";
import {useAuthRedirect} from "@/hooks/useAuthRedirect";
import {useParams} from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLoading } from "@/hooks/useLoading";

cytoscape.use(dagre);

const nodeThemeColors = {
  dark: {
    background: "#0a0a0a",
    foreground: "#f0f0f0",
    primary: "#333333",
    primaryForeground: "#f0f0f0",
    border: "#2a2a2a",
    accent: "#666666",
    subtle: "rgba(255, 255, 255, 0.05)",
  },
  light: {
    background: "#ffffff",
    foreground: "#222222",
    primary: "#e8e8e8",
    primaryForeground: "#222222",
    border: "#dddddd",
    accent: "#888888",
    subtle: "rgba(0, 0, 0, 0.02)",
  },
};

export default function SkillTree({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  title = "Skill Progression Tree",
}: {
  nodes?: NodeData[];
  edges?: EdgeData[];
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyReference = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { theme = "dark", setTheme } = useTheme();
  const token = useAuthRedirect();
  const params = useParams<{ course_id: string }>();
  const course_id = params?.course_id;
  const [skillTree, setSkillTree] = useState<SkillTreeType>({
    nodes: initialNodes,
    edges: initialEdges
  });

  const { loading, startLoading, stopLoading } = useLoading(); 

  const fetchSkillTree = useCallback(async () => {
    if (!course_id || !token) return;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchTree = async () => {
      try {
        const response = await skillTreeService.get(`/skill-tree?course_id=${course_id}`, { headers });
        return response.data;
      } catch (err) {
        console.error("Failed to fetch skill tree:", err);
        return { success: false };
      }
    };

    const createTree = async () => {
      startLoading();
      try {
        const response = await skillTreeService.post(`/create?course_id=${course_id}`, null, { headers });
        stopLoading();
        return response.data;
      } catch (err) {
        console.error("Failed to create skill tree:", err);
        return { success: false };
      }
    };

    const updateTree = async () => {
      startLoading();
      try {
        const response = await skillTreeService.post(`/update?course_id=${course_id}`, null, { headers });
        stopLoading();
        return response.data;
      } catch (err) {
        console.warn("Skill tree update failed (possibly doesn't exist yet):", err);
        return { success: false };
      }
    };

    try {
      let data = await fetchTree();

      if (!data.success) {
        data = await createTree();
      } else {
        data = await updateTree();
      }

      data = await fetchTree();
      if (data.success && data.skill_tree) {
        const { nodes, edges } = data.skill_tree;
        setSkillTree({ nodes, edges });
      }
    } catch (error) {
      console.error("Failed to fetch or build skill tree:", error);
    }
  }, [course_id, token]);

  useEffect(() => {
    if(course_id && token) {
      fetchSkillTree();
    }
  }, [course_id, token, fetchSkillTree]);

  const handleNodeStatusChange = useCallback(async (nodeId: number, status: string) => {
    // Update locally
    setSkillTree(prevTree => {
      const updatedNodes = prevTree.nodes.map(node =>
        node.id === nodeId ? { ...node, state: status } : node
      );
      return { ...prevTree, nodes: updatedNodes };
    });

    // Refresh the entire skill tree from backend
    await fetchSkillTree();
  }, [fetchSkillTree]);

  useEffect(() => {
    setIsClient(true);

    if (!theme) {
      setTheme("dark");
    }
  }, [theme, setTheme]);

  useEffect(() => {
    if (cyReference.current && isClient) {
      const colors = theme === "dark" ? nodeThemeColors.dark : nodeThemeColors.light;

      cyReference.current
        .style()
        .selector("core")
        .style({
          "background-color": colors.background,
          "background-opacity": 0.9,
          "border-width": 0,
          "border-color": colors.border,
          "border-style": "solid",
        })
        .update();

      cyReference.current
        .style()
        .selector("node")
        .style({
          "background-color": colors.background,
          "background-opacity": 0.7,
          "border-width": 4,
          "border-color": colors.border,
          "border-style": "solid",
          "text-valign": "center",
          "text-halign": "center",
          color: colors.primaryForeground,
          "font-weight": "200",
          "font-size": "13px",
          "font-family": "'Inter', 'Helvetica Neue', sans-serif",
          width: "label",
          height: "label",
          "padding-left": "22px",
          "padding-right": "22px",
          "padding-top": "14px",
          "padding-bottom": "14px",
          label: "data(label)",
          "text-wrap": "wrap",
          "text-max-width": "160px",
          shape: "round-rectangle",
          "border-radius": 12,
          "shadow-blur": 15,
          "shadow-color": colors.subtle,
          "shadow-opacity": 0.8,
          "shadow-offset-x": 0,
          "shadow-offset-y": 2,
          "text-outline-width": 0,
          "text-outline-opacity": 0,
          "text-margin-y": 0,
          "text-transform": "none",
          "text-letter-spacing": 0.3, // Elegant letter spacing
        })
        .selector("node:selected")
        .style({
          "border-color": colors.accent,
          "border-width": 4,
          "padding-left": "24px",
          "padding-right": "24px",
          "padding-top": "16px",
          "padding-bottom": "16px",
          "shadow-blur": 25,
          "shadow-color": colors.accent,
          "shadow-opacity": 0.3,
          "shadow-offset-x": 0,
          "shadow-offset-y": 3,
        })
        .selector("edge")
        .style({
          width: 1, // Ultra-thin lines
          "curve-style": "unbundled-bezier",
          "line-color":
            theme === "dark"
              ? "rgba(240, 240, 240, 0.2)"
              : "rgba(34, 34, 34, 0.15)",
          "target-arrow-color":
            theme === "dark"
              ? "rgba(240, 240, 240, 0.3)"
              : "rgba(34, 34, 34, 0.25)",
          "target-arrow-fill": "filled",
          "target-arrow-shape": "triangle",
          "arrow-scale": 0.8, // Smaller, more elegant arrows
          opacity: 0.7,
          "edge-distances": "node-position",
          "control-point-step-size": 30, // Reduced for straighter lines
          "control-point-weight": 0.3, // Reduced for straighter lines
          "control-point-distances": [20, -20], // Reduced for straighter lines
          "source-endpoint": "outside-to-node",
          "target-endpoint": "outside-to-node",
        })
        .selector("edge:hover")
        .style({
          width: 1.5,
          opacity: 1,
          "line-color": colors.accent,
          "target-arrow-color": colors.accent,
          "transition-property":
            "opacity, width, line-color, target-arrow-color",
          "transition-duration": "0.2s",
          "transition-timing-function": "ease-in-out",
        })
        .update();

      if (containerRef.current) {
        containerRef.current.style.backgroundColor = colors.background;
      }
    }
  }, [theme, isClient]);

  const currentThemeColors = theme === "dark" ? nodeThemeColors.dark : nodeThemeColors.light;

  useEffect(() => {
    if (!containerRef.current || !isClient) {
      return;
    }

    const { nodes, edges } = skillTree;

    if (!nodes || !edges) {
      return;
    }

    const elements = [
      ...nodes.map((node) => ({
        data: {
          ...node,
          label: node.name || `Node ${node.id}`,
        },
      })),
      ...edges.map((edge) => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source.toString(),
          target: edge.target.toString(),
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "core",
          style: {
            "background-color": currentThemeColors.background,
            "background-opacity": 1,
          },
        },
        {
          selector: "node",
          style: {
            "background-color": currentThemeColors.background,
            "background-opacity": 0.7,
            "border-width": 4, // Ultra-thin border
            "border-color": currentThemeColors.border,
            "border-style": "solid",
            "text-valign": "center",
            "text-halign": "center",
            color: currentThemeColors.primaryForeground,
            "font-weight": "200", // Extra light font weight
            "font-size": "13px",
            "font-family": "'Inter', 'Helvetica Neue', sans-serif", // More elegant font
            width: "label",
            height: "label",
            "padding-left": "22px",
            "padding-right": "22px",
            "padding-top": "14px",
            "padding-bottom": "14px",
            label: "data(label)",
            "text-wrap": "wrap",
            "text-max-width": "160px", // Wider for better text flow
            shape: "round-rectangle",
            "border-radius": 12, // More rounded corners
            "shadow-blur": 15,
            "shadow-color": currentThemeColors.subtle,
            "shadow-opacity": 0.8,
            "shadow-offset-x": 0,
            "shadow-offset-y": 2,
            "text-outline-width": 0,
            "text-outline-opacity": 0,
            "text-margin-y": 0,
            "text-transform": "none",
            "text-letter-spacing": 0.3, // Elegant letter spacing
          },
        },
        {
          selector: "node[state='completed']",
          style: {
            "background-color": "#4ade80", // Green for completed
            "background-opacity": 0.1,
            "border-color": "#22c55e",
            "border-width": 4,
          },
        },
        {
          selector: "node[state='in_progress']",
          style: {
            "background-color": "#60a5fa", // Blue for in progress
            "background-opacity": 0.1,
            "border-color": "#3b82f6",
            "border-width": 4,
          },
        },
        {
          selector: "node[state='locked']",
          style: {
            "background-color": "#9ca3af", // Gray for locked
            "background-opacity": 0.1,
            "border-color": "#6b7280",
            "border-width": 4,
            color: theme === "dark" ? "#9ca3af" : "#6b7280",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": currentThemeColors.accent,
            "border-width": 4,
            "padding-left": "24px",
            "padding-right": "24px",
            "padding-top": "16px",
            "padding-bottom": "16px",
            "shadow-blur": 25,
            "shadow-color": currentThemeColors.accent,
            "shadow-opacity": 0.3,
            "shadow-offset-x": 0,
            "shadow-offset-y": 3,
            "background-color":
              theme === "dark"
                ? "rgba(138, 133, 255, 0.05)"
                : "rgba(99, 102, 241, 0.03)",
          },
        },
        {
          selector: "node:active",
          style: {
            "overlay-color": currentThemeColors.primary,
            "overlay-padding": 10,
            "overlay-opacity": 0.3,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1, // Ultra-thin lines
            "curve-style": "bezier", // Less pronounced curves
            "line-color":
              theme === "dark"
                ? "rgba(240, 240, 240, 0.2)"
                : "rgba(34, 34, 34, 0.15)",
            "target-arrow-color":
              theme === "dark"
                ? "rgba(240, 240, 240, 0.3)"
                : "rgba(34, 34, 34, 0.25)",
            "target-arrow-fill": "filled",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8, // Smaller, more elegant arrows
            opacity: 0.7,
            "edge-distances": "node-position",
            "control-point-step-size": 30, // Reduced for straighter lines
            "control-point-weight": 0.3, // Reduced for straighter lines
            "control-point-distances": [20, -20], // Reduced for straighter lines
            "source-endpoint": "outside-to-node",
            "target-endpoint": "outside-to-node",
          },
        },
        {
          selector: "edge:hover",
          style: {
            width: 1.5,
            opacity: 1,
            "line-color": currentThemeColors.accent,
            "target-arrow-color": currentThemeColors.accent,
            "transition-property":
              "opacity, width, line-color, target-arrow-color",
            "transition-duration": "0.2s",
            "transition-timing-function": "ease-in-out",
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR", // Left to right layout
        nodeSep: 120, // Much more space between nodes on same rank
        edgeSep: 50, // More space between edges
        rankSep: 180, // More space between ranks
        padding: 80,
        animate: true,
        animationDuration: 900, // Slower animation for elegance
        animationEasing: "ease-in-out-cubic", // Smoother easing
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      wheelSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 2,
    });

    cy.nodes().grabify();

    cy.on("tap", "node", (event) => {
      const nodeId = parseInt(event.target.id());
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
      }
    });

    cy.on("mouseover", "edge", (event) => {
      event.target.addClass("hover");
    });
    cy.on("mouseout", "edge", (event) => {
      event.target.removeClass("hover");
    });

    cyReference.current = cy;
    cy.resize();
    cy.fit(undefined, 50);

    // keep it responsive if the window size changes
    const handleResize = () => {
      cy.resize();
      cy.fit(undefined, 50);
    };
    window.addEventListener("resize", handleResize);

    if (containerRef.current) {
      containerRef.current.style.backgroundColor = currentThemeColors.background;
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cy.destroy();
      cyReference.current = null;
    };
  }, [skillTree, theme, isClient]);

  const handleZoomIn = () => {
    if (cyReference.current) {
      const currentZoom = cyReference.current.zoom();
      cyReference.current.zoom({
        level: currentZoom * 1.2,
        renderedPosition: {
          x: cyReference.current.width() / 2,
          y: cyReference.current.height() / 2,
        },
      });
    }
  };

  const handleZoomOut = () => {
    if (cyReference.current) {
      const currentZoom = cyReference.current.zoom();
      cyReference.current.zoom({
        level: currentZoom * 0.8,
        renderedPosition: {
          x: cyReference.current.width() / 2,
          y: cyReference.current.height() / 2,
        },
      });
    }
  };

  const handleReset = () => {
    if (cyReference.current) {
      cyReference.current.fit(undefined, 50);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  if (loading) return <LoadingSpinner subMessage="Skill Tree is being created or updated"/>;

  return (
    <Card className="border-border bg-background text-foreground flex size-full flex-col border shadow-md">
      <div className="border-border from-primary/5 via-secondary/5 to-background border-b bg-gradient-to-br p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground/90 text-lg font-semibold">{title}</h3>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="border-border/50 bg-background/40 text-foreground/80 hover:bg-background/60 hover:text-foreground backdrop-blur-sm transition-all duration-300"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    className="border-border/50 bg-background/40 text-foreground/80 hover:bg-background/60 hover:text-foreground backdrop-blur-sm transition-all duration-300"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="border-border/50 bg-background/40 text-foreground/80 hover:bg-background/60 hover:text-foreground backdrop-blur-sm transition-all duration-300"
                  >
                    <Home className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFullscreen}
                    className="border-border/50 bg-background/40 text-foreground/80 hover:bg-background/60 hover:text-foreground backdrop-blur-sm transition-all duration-300"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fullscreen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="from-background via-background to-background/95 h-[calc(94vh-4rem)] w-full bg-gradient-to-br"
          aria-label="Skill tree visualization"
        />
        <div className="absolute right-4 top-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 text-foreground hover:bg-muted shadow-md"
                >
                  <Info className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Click on a node for details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isClient && selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          open={!!selectedNode}
          onClose={() => setSelectedNode(null)}
          onNodeStatusChange={handleNodeStatusChange}
        />
      )}
    </Card>
  );
}