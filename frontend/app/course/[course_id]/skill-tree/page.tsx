"use client";

import type { NodeData, EdgeData, SkillTree as SkillTreeType } from "@/app/types";
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
import { Home, Info, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { skillTreeService, chatService } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLoading } from "@/hooks/useLoading";
import { cn } from "@/lib/utils";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, Sparkles } from "lucide-react";

// Register the dagre layout extension
if (typeof window !== "undefined") {
  cytoscape.use(dagre);
}

// Theme configuration for nodes based on color mode
const nodeThemeColors = {
  dark: {
    background: "#0a0a0a",
    foreground: "#f0f0f0",
    primary: "#333333",
    primaryForeground: "#f0f0f0",
    border: "#2a2a2a",
    accent: "#666666",
    subtle: "rgba(255, 255, 255, 0.05)",
    completed: {
      background: "rgba(74, 222, 128, 0.1)",
      border: "#22c55e",
    },
    inProgress: {
      background: "rgba(96, 165, 250, 0.1)",
      border: "#3b82f6",
    },
    locked: {
      background: "rgba(156, 163, 175, 0.1)",
      border: "#6b7280",
      text: "#9ca3af",
    },
  },
  light: {
    background: "#ffffff",
    foreground: "#222222",
    primary: "#e8e8e8",
    primaryForeground: "#222222",
    border: "#dddddd",
    accent: "#888888",
    subtle: "rgba(0, 0, 0, 0.02)",
    completed: {
      background: "rgba(74, 222, 128, 0.1)",
      border: "#22c55e",
    },
    inProgress: {
      background: "rgba(96, 165, 250, 0.1)",
      border: "#3b82f6",
    },
    locked: {
      background: "rgba(156, 163, 175, 0.1)",
      border: "#6b7280",
      text: "#6b7280",
    },
  },
};

export default function SkillTree({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  title = "Skill Tree",
}: {
  nodes?: NodeData[];
  edges?: EdgeData[];
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyReference = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hasChats, setHasChats] = useState<boolean>(false);
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
  const { toast } = useToast();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  // Get current theme colors
  const currentThemeColors = useMemo(() =>
    theme === "dark" ? nodeThemeColors.dark : nodeThemeColors.light,
  [theme]);

  // Fetch whether the course have chats
  const chatDataExist = useCallback(
    async (courseId: string) => {
      if (!token || !courseId) return;
      const chatResponse = await chatService.get(
          `/course/${courseId}/chats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      console.log(chatResponse);
        if (chatResponse?.data.length > 0) {
          setHasChats(true);
        } else {
          setHasChats(false);
        }
    },
    [token, toast, course_id]
  );

  const fetchSkillTree = useCallback(async () => {
    if (!course_id || !token) return;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const updatePassedSlideCount = () => {
      return skillTreeService.get(`/skill-tree?course_id=${course_id}`,
      {headers},)
      .then((response) => {
        const newCount = 1;
        return skillTreeService.post(`/update-slide-count?course_id=${course_id}&passed_slide_count=${newCount}`,
            {},
            {headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            }},
        );
      })
      .catch((error) => {
        console.error("Failed to update slide count:", error);
        return Promise.resolve();
      });
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
        const createResult = await createTree();
        if(createResult.success) {
          data = createResult;
        }
      } else if (data.passed_slide_count >= 5) {
        const updateResult = await updateTree();
        if (updateResult.success) {
          data = updateResult;
          await updatePassedSlideCount();
        }
      }

      data = await fetchTree();
      if (data.success && data.skill_tree) {
        const { nodes, edges } = data.skill_tree;
        setSkillTree({ nodes, edges });
      }
    } catch (error) {
      console.error("Failed to build skill tree:", error);
      toast({
        title: "Error",
        description: `Failed to build skill tree data because of lack of discussion or time limit exceeded for response.`,
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  }, [course_id, startLoading, stopLoading, token]);


  useEffect(() => {
    if(course_id && token) {
      chatDataExist(course_id);
      fetchSkillTree();
    }
  }, [course_id, token]);

  // Handle node status changes
  const handleNodeStatusChange = useCallback(async (nodeId: number, status: string) => {
    setSkillTree(prevTree => {
      const updatedNodes = prevTree.nodes.map(node =>
        node.id === nodeId ? { ...node, state: status } : node
      );
      return { ...prevTree, nodes: updatedNodes };
    });

    await fetchSkillTree();
  }, [fetchSkillTree]);

  useEffect(() => {
    setIsClient(true);
     if (!theme) {
          setTheme("dark");
        }
  }, [theme, setTheme]);

  // Apply theme styles to Cytoscape
  useEffect(() => {
    if (cyReference.current && isClient) {
      const colors = currentThemeColors;

      // Update core styles
      cyReference.current
        .style()
        .selector("core")
        .style({
          "background-color": colors.background,
          "background-opacity": 0.9,
        })
        .update();

      // Update node styles
      cyReference.current
        .style()
        .selector("node")
        .style({
          "background-color": colors.background,
          "background-opacity": 0.7,
          "border-width": 4,
          "border-color": colors.border,
          color: colors.foreground,
        })
        .selector("node[state='completed']")
        .style({
          "background-color": colors.completed.background,
          "border-color": colors.completed.border,
        })
        .selector("node[state='in_progress']")
        .style({
          "background-color": colors.inProgress.background,
          "border-color": colors.inProgress.border,
        })
        .selector("node[state='locked']")
        .style({
          "background-color": colors.locked.background,
          "border-color": colors.locked.border,
          "color": colors.locked.text,
        })
        .update();

      // Update edge styles
      cyReference.current
        .style()
        .selector("edge")
        .style({
          "line-color": theme === "dark" ? "rgba(240, 240, 240, 0.2)" : "rgba(34, 34, 34, 0.15)",
          "target-arrow-color": theme === "dark" ? "rgba(240, 240, 240, 0.3)" : "rgba(34, 34, 34, 0.25)",
        })
        .update();

      // Update container background
      if (containerRef.current) {
        containerRef.current.style.backgroundColor = colors.background;
      }
    }
  }, [theme, isClient, currentThemeColors]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !isClient || !skillTree.nodes || !skillTree.edges) {
      return;
    }

    const { nodes, edges } = skillTree;

    // Create elements for Cytoscape
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

    // Initialize Cytoscape
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
            "border-width": 4,
            "border-color": currentThemeColors.border,
            "border-style": "solid",
            "text-valign": "center",
            "text-halign": "center",
            color: currentThemeColors.foreground,
            "font-weight": "300",
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
            "shadow-color": currentThemeColors.subtle,
            "shadow-opacity": 0.8,
            "shadow-offset-x": 0,
            "shadow-offset-y": 2,
            "text-outline-width": 0,
            "text-outline-opacity": 0,
            "text-margin-y": 0,
            "text-transform": "none",
            "text-letter-spacing": 0.3,
          },
        },
        {
          selector: "node[state='completed']",
          style: {
            "background-color": currentThemeColors.completed.background,
            "border-color": currentThemeColors.completed.border,
          },
        },
        {
          selector: "node[state='in_progress']",
          style: {
            "background-color": currentThemeColors.inProgress.background,
            "border-color": currentThemeColors.inProgress.border,
          },
        },
        {
          selector: "node[state='locked']",
          style: {
            "background-color": currentThemeColors.locked.background,
            "border-color": currentThemeColors.locked.border,
            color: currentThemeColors.locked.text,
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
            "background-color": theme === "dark"
              ? "rgba(138, 133, 255, 0.05)"
              : "rgba(99, 102, 241, 0.03)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "curve-style": "bezier",
            "line-color": theme === "dark"
              ? "rgba(240, 240, 240, 0.2)"
              : "rgba(34, 34, 34, 0.15)",
            "target-arrow-color": theme === "dark"
              ? "rgba(240, 240, 240, 0.3)"
              : "rgba(34, 34, 34, 0.25)",
            "target-arrow-fill": "filled",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
            opacity: 0.7,
            "edge-distances": "node-position",
            "control-point-step-size": 30,
            "control-point-weight": 0.3,
            "control-point-distances": [20, -20],
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
            "transition-property": "opacity, width, line-color, target-arrow-color",
            "transition-duration": "0.2s",
            "transition-timing-function": "ease-in-out",
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 120,
        edgeSep: 50,
        rankSep: 180,
        padding: 80,
        animate: true,
        animationDuration: 900,
        animationEasing: "ease-in-out-cubic",
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      wheelSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 2,
    });

    // Enable node grabbing
    cy.nodes().grabify();

    // Event handlers
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

    // Store reference and fit view
    cyReference.current = cy;
    cy.resize();
    cy.fit(undefined, 50);

    // Handle window resize
    const handleResize = () => {
      if (cy) {
        cy.resize();
        cy.fit(undefined, 50);
      }
    };

    window.addEventListener("resize", handleResize);

    // Set container background
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = currentThemeColors.background;
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cy.destroy();
      cyReference.current = null;
    };
  }, [skillTree, theme, isClient, currentThemeColors]);

  // Zoom in handler
  const handleZoomIn = useCallback(() => {
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
  }, []);

  // Zoom out handler
  const handleZoomOut = useCallback(() => {
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
  }, []);

  // Reset view handler
  const handleReset = useCallback(() => {
    if (cyReference.current) {
      cyReference.current.fit(undefined, 50);
    }
  }, []);

  // Fullscreen handler
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  if (!hasChats && !skillTree) {
    return (
    <div className="-mt-[8vh] flex h-screen items-center justify-center bg-muted">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background to-background/80 p-8 text-center text-foreground shadow-lg">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute size-24 rounded-full bg-primary/5"
            style={{
              left: `${Math.random() * 100 - 50}px`,
              top: `${Math.random() * 100 - 50}px`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      {/* Card content */}
      <div className="relative z-10">
        <div className="relative mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="relative rounded-full border border-border/50 bg-background p-4 shadow-md">
            <MessageSquare className="mx-auto size-12 text-primary" />
          </div>
        </div>

        <h3 className="mb-2 text-2xl font-thin">Start Your Learning Journey</h3>

        <p className="mb-8 font-light text-muted-foreground">
          No chat conversations found for this course yet. Begin a conversation to generate your personalized skill tree
          and track your progress.
        </p>

        <div className="space-y-4">
          <div>
            <Button
              variant="default"
              size="lg"
              className="group relative w-full overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => router.replace(`/course/${course_id}/chat`)}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="font-light">Start a Conversation</span>
                <span className={isHovering ? "translate-x-1 transition-transform" : "transition-transform"}>
                  <ArrowRight className="size-4" />
                </span>
              </span>
              <span
                className={`absolute inset-0 bg-primary/10 transition-transform duration-300 ${
                  isHovering ? "translate-x-0" : "-translate-x-full"
                }`}
              />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1 text-xs font-thin text-muted-foreground">
          <Sparkles className="size-3" />
          <span>Conversations help build your personalized skill tree</span>
        </div>
      </div>
    </div>
    </div>
    );
  } else if (loading) {
    return <LoadingSpinner subMessage="Skill Tree is being created or updated" />;
  }

  return (
    <Card className="flex size-full flex-col border border-border bg-background text-foreground shadow-md">
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4 shadow-md">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-thin">{title}</h3>
          </div>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="border-border/50 bg-background/40 text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:bg-background/60 hover:text-foreground"
                  >
                    <ZoomIn className="size-4" />
                    <span className="sr-only">Zoom In</span>
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
                    className="border-border/50 bg-background/40 text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:bg-background/60 hover:text-foreground"
                  >
                    <ZoomOut className="size-4" />
                    <span className="sr-only">Zoom Out</span>
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
                    className="border-border/50 bg-background/40 text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:bg-background/60 hover:text-foreground"
                  >
                    <Home className="size-4" />
                    <span className="sr-only">Reset View</span>
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
                    className="border-border/50 bg-background/40 text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:bg-background/60 hover:text-foreground"
                  >
                    <Maximize2 className="size-4" />
                    <span className="sr-only">Fullscreen</span>
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

      <div className="relative grow">
        <div
          ref={containerRef}
          className={cn(
            "h-[calc(94vh-4rem)] w-full bg-gradient-to-br from-background via-background to-background/95",
            "transition-colors duration-300"
          )}
          aria-label="Skill tree visualization"
        />

        {/* Info button */}
        <div className="absolute bottom-8 right-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 text-foreground shadow-md hover:bg-muted"
                >
                  <Info className="size-4" />
                  <span className="sr-only">Information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click on a node for details</p>
              </TooltipContent>
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