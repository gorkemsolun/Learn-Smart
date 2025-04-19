"use client";

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Code,
  Home,
  Info,
  Maximize2,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

// Register extensions
cytoscape.use(dagre);

interface NodeData {
  id: string;
  label?: string;
  description?: string;
  level?: number;
  progress?: number;
  prerequisites?: string[];
  skills?: string[];
  completed?: boolean;
}

interface SkillTreeProps {
  nodes?: NodeData[];
  edges?: { source: string; target: string }[];
  title?: string;
}

// Level icons mapping
const levelIcons = {
  1: BookOpen,
  2: Code,
  3: Zap,
  4: Award,
};

const defaultNodes: NodeData[] = [
  {
    id: "A",
    label: "Basic Skills",
    description: "Foundational knowledge required for all advanced topics",
    level: 1,
    progress: 100,
    completed: true,
    skills: ["Variables", "Control Flow", "Basic Data Types", "Functions"],
    prerequisites: [],
  },
  {
    id: "B",
    label: "Intermediate",
    description: "Building on the basics with more complex concepts",
    level: 2,
    progress: 65,
    completed: false,
    skills: [
      "Object-Oriented Programming",
      "Error Handling",
      "Asynchronous Code",
      "Data Structures",
    ],
    prerequisites: ["Basic Skills"],
  },
  {
    id: "C",
    label: "Advanced",
    description: "Expert-level skills and specialized knowledge",
    level: 3,
    progress: 30,
    completed: false,
    skills: [
      "Design Patterns",
      "Performance Optimization",
      "Security",
      "Testing Strategies",
    ],
    prerequisites: ["Intermediate"],
  },
  {
    id: "D",
    label: "Mastery",
    description: "Complete mastery of the subject area",
    level: 4,
    progress: 0,
    completed: false,
    skills: [
      "System Architecture",
      "Scalability",
      "Mentoring",
      "Technical Leadership",
    ],
    prerequisites: ["Advanced"],
  },
  {
    id: "E",
    label: "Specialization",
    description: "Focused expertise in niche areas",
    level: 3,
    progress: 45,
    completed: false,
    skills: [
      "Machine Learning",
      "Blockchain",
      "Graphics Programming",
      "Embedded Systems",
    ],
    prerequisites: ["Basic Skills"],
  },
];

const defaultEdges = [
  { source: "A", target: "B" },
  { source: "A", target: "E" },
  { source: "B", target: "C" },
  { source: "C", target: "D" },
  { source: "E", target: "D" },
];

// Enhanced Node Details Modal
const NodeDetailsModal = ({
  node,
  open,
  onClose,
}: {
  node: NodeData | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!node) return null;

  const LevelIcon =
    (node.level && levelIcons[node.level as keyof typeof levelIcons]) ||
    BookOpen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="from-background to-background/90 border-border text-foreground bg-gradient-to-br sm:max-w-md">
        <div className="from-background to-background/80 border-background absolute -top-12 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center rounded-full border-4 bg-gradient-to-br shadow-xl">
          <div
            className={`flex size-16 items-center justify-center rounded-full ${
              node.level === 1
                ? "bg-gradient-to-br from-emerald-500/80 to-emerald-600"
                : node.level === 2
                  ? "from-primary/80 to-primary bg-gradient-to-br"
                  : node.level === 3
                    ? "from-secondary/80 to-secondary bg-gradient-to-br"
                    : "bg-gradient-to-br from-amber-500/80 to-amber-600"
            }`}
          >
            <LevelIcon className="size-8 text-white" />
          </div>
        </div>

        <DialogHeader className="pt-10 text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {node.label || `Node ${node.id}`}
          </DialogTitle>
          <div className="mt-2 flex justify-center">
            <Badge
              variant="outline"
              className={`
                ${
                  node.level === 1
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : node.level === 2
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : node.level === 3
                        ? "bg-secondary/10 border-secondary/30 text-secondary"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }
              `}
            >
              Level {node.level}
            </Badge>

            {node.completed && (
              <Badge className="ml-2 border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="mr-1 size-3" /> Completed
              </Badge>
            )}
          </div>
          <DialogDescription className="text-muted-foreground mt-4">
            {node.description ||
              "No additional information available for this node."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">
                {node.progress || 0}%
              </span>
            </div>
            <Progress
              value={node.progress || 0}
              className="bg-muted h-2"
              indicatorClassName={`
                ${
                  node.level === 1
                    ? "bg-emerald-500"
                    : node.level === 2
                      ? "bg-primary"
                      : node.level === 3
                        ? "bg-secondary"
                        : "bg-amber-500"
                }
              `}
            />
          </div>

          <Separator className="bg-border" />

          {/* Skills section */}
          {node.skills && node.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {node.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-muted hover:bg-muted/80 text-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites section */}
          {node.prerequisites && node.prerequisites.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                Prerequisites
              </h4>
              <div className="space-y-2">
                {node.prerequisites.map((prereq, index) => (
                  <div
                    key={index}
                    className="text-muted-foreground flex items-center text-sm"
                  >
                    <ArrowRight className="text-muted-foreground mr-2 size-3" />
                    {prereq}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted hover:text-foreground"
          >
            Close
          </Button>
          <div className="flex gap-2">
            {!node.completed && (
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted hover:text-foreground"
              >
                Mark as In Progress
              </Button>
            )}
            <Button
              className={`
                ${
                  node.level === 1
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : node.level === 2
                      ? "bg-primary hover:bg-primary/90"
                      : node.level === 3
                        ? "bg-secondary hover:bg-secondary/90"
                        : "bg-amber-600 hover:bg-amber-700"
                }
              `}
            >
              {node.completed ? "Review Skills" : "Start Learning"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SkillTree: React.FC<SkillTreeProps> = ({
  nodes = defaultNodes,
  edges = defaultEdges,
  title = "Skill Progression Tree",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { theme, setTheme } = useTheme();

  // Define colors for the skill tree based on the theme
  const themeColors = {
    dark: {
      primary: "#0ea5e9", // sky-500
      primaryForeground: "#f8fafc", // slate-50
      secondary: "#a855f7", // purple-500
      secondaryForeground: "#f8fafc", // slate-50
      accent: "#f59e0b", // amber-500
      accentForeground: "#f8fafc", // slate-50
      muted: "#1e1e1e", // Very dark gray
      mutedForeground: "#a1a1aa", // zinc-400
      background: "#000000", // Black
      foreground: "#f8fafc", // slate-50
      border: "#27272a", // zinc-800
      success: "#22c55e", // green-500
      successForeground: "#f8fafc", // slate-50
      warning: "#f59e0b", // amber-500
      warningForeground: "#f8fafc", // slate-50
    },
    light: {
      primary: "#0ea5e9", // sky-500
      primaryForeground: "#020617", // slate-900
      secondary: "#a855f7", // purple-500
      secondaryForeground: "#020617", // slate-900
      accent: "#f59e0b", // amber-500
      accentForeground: "#020617", // slate-900
      muted: "#f3f4f6", // Very light gray
      mutedForeground: "#6b7280", // zinc-500
      background: "#ffffff", // White
      foreground: "#020617", // slate-900
      border: "#e5e7eb", // zinc-200
      success: "#22c55e", // green-500
      successForeground: "#020617", // slate-900
      warning: "#f59e0b", // amber-500
      warningForeground: "#020617", // slate-900
    },
  };

  // Handle client-side rendering for createPortal
  useEffect(() => {
    setIsClient(true);

    // Force theme to dark if not set
    if (!theme) {
      console.log("Setting default theme to dark");
      setTheme("dark");
    }

    console.log("Theme in SkillTree:", theme);
  }, [theme, setTheme]);

  // Add a useEffect to force Cytoscape to update when theme changes
  useEffect(() => {
    if (cyRef.current && isClient) {
      console.log("Updating Cytoscape with theme:", theme);

      // Get current theme colors
      const colors = theme === "dark" ? themeColors.dark : themeColors.light;

      // Update node styles
      cyRef.current
        .style()
        .selector("node")
        .style({
          "background-color": colors.primary,
          "border-color": "#000000", // Black border for all nodes
          color: colors.primaryForeground,
          // Reset shadow properties
          "shadow-blur": 0,
          "shadow-opacity": 0,
        })
        .selector("node[level=1]")
        .style({
          "background-color": colors.success,
        })
        .selector("node[level=2]")
        .style({
          "background-color": colors.primary,
        })
        .selector("node[level=3]")
        .style({
          "background-color": colors.secondary,
        })
        .selector("node[level=4]")
        .style({
          "background-color": colors.warning,
        })
        .selector("node:selected")
        .style({
          // Add shadow underlay for selected nodes based on their level
          "shadow-blur": 15,
          "shadow-opacity": 0.5,
          "border-width": 4,
        })
        .selector("edge")
        .style({
          "line-color": colors.mutedForeground,
          "target-arrow-color": "#000000", // Black arrow heads
          "target-arrow-fill": "hollow", // Hollow arrow heads
        })
        .update();

      // Update container background
      if (containerRef.current) {
        containerRef.current.className = `w-full h-[60vh] min-h-[400px] ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`;
      }
    }
  }, [theme, isClient]);

  // Define colors for the skill tree
  const colors = theme === "dark" ? themeColors.dark : themeColors.light;

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert nodes and edges to Cytoscape format
    const elements = [
      ...nodes.map((node) => ({
        data: {
          ...node,
          label: node.label || node.id,
        },
      })),
      ...edges.map((edge) => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
        },
      })),
    ];

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": colors.primary,
            "background-opacity": 0.9,
            "border-width": 3, // Consistent border width for all nodes
            "border-color": "#000000", // Black border for all nodes
            "border-style": "solid", // Consistent border style
            "text-valign": "center",
            "text-halign": "center",
            color: colors.primaryForeground,
            "font-weight": "bold",
            "font-size": "12px",
            width: "label",
            height: "label",
            "padding-left": "15px",
            "padding-right": "15px",
            "padding-top": "10px",
            "padding-bottom": "10px",
            label: "data(label)",
            "text-wrap": "wrap",
            "text-max-width": "120px",
            shape: "round-rectangle",
            "transition-property":
              "background-color, border-color, width, height, shadow-blur, shadow-opacity",
            "transition-duration": "0.2s",
            // Add default shadow properties (invisible by default)
            "shadow-blur": 0,
            "shadow-color": "#000000",
            "shadow-opacity": 0,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,
          },
        },
        {
          selector: "node:selected",
          style: {
            // Use the node's own color for the border when selected
            "border-color": (ele) => {
              if (ele.data("level") === 1) {
                return colors.success;
              } else if (ele.data("level") === 2) {
                return colors.primary;
              } else if (ele.data("level") === 3) {
                return colors.secondary;
              } else if (ele.data("level") === 4) {
                return colors.warning;
              } else {
                return colors.primary;
              }
            },
            "border-width": 4, // Slightly thicker border for selected nodes
            // Add a bit more padding for selected nodes
            "padding-left": "18px",
            "padding-right": "18px",
            "padding-top": "12px",
            "padding-bottom": "12px",
            // Add shadow underlay for selected nodes
            "shadow-blur": 15,
            "shadow-color": (ele) => {
              if (ele.data("level") === 1) {
                return colors.success;
              } else if (ele.data("level") === 2) {
                return colors.primary;
              } else if (ele.data("level") === 3) {
                return colors.secondary;
              } else if (ele.data("level") === 4) {
                return colors.warning;
              } else {
                return colors.primary;
              }
            },
            "shadow-opacity": 0.5,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,
          },
        },
        {
          selector: "node:active",
          style: {
            "overlay-color": colors.accent,
            "overlay-padding": 10,
            "overlay-opacity": 0.3,
          },
        },
        {
          selector: "node[level=1]",
          style: {
            "background-color": colors.success,
          },
        },
        {
          selector: "node[level=2]",
          style: {
            "background-color": colors.primary,
          },
        },
        {
          selector: "node[level=3]",
          style: {
            "background-color": colors.secondary,
          },
        },
        {
          selector: "node[level=4]",
          style: {
            "background-color": colors.warning,
          },
        },
        {
          selector: "node[completed=true]",
          style: {
            "border-width": 3, // Keep consistent with other nodes
            "border-style": "double",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            // Use straight edges instead of curved
            "curve-style": "straight",
            // Use gradient colors based on source and target nodes
            "line-fill": "linear-gradient",
            "line-gradient-stop-colors": (ele) => {
              const sourceNode = ele.source();
              const targetNode = ele.target();
              let sourceColor, targetColor;

              // Get source node color based on level
              if (sourceNode.data("level") === 1) {
                sourceColor = colors.success;
              } else if (sourceNode.data("level") === 2) {
                sourceColor = colors.primary;
              } else if (sourceNode.data("level") === 3) {
                sourceColor = colors.secondary;
              } else if (sourceNode.data("level") === 4) {
                sourceColor = colors.warning;
              } else {
                sourceColor = colors.primary;
              }

              // Get target node color based on level
              if (targetNode.data("level") === 1) {
                targetColor = colors.success;
              } else if (targetNode.data("level") === 2) {
                targetColor = colors.primary;
              } else if (targetNode.data("level") === 3) {
                targetColor = colors.secondary;
              } else if (targetNode.data("level") === 4) {
                targetColor = colors.warning;
              } else {
                targetColor = colors.primary;
              }

              return `${sourceColor} ${targetColor}`;
            },
            "line-gradient-stop-positions": "0% 100%",
            "target-arrow-color": "#000000", // Black arrow heads
            "target-arrow-fill": "hollow", // Hollow arrow heads (white inside)
            "target-arrow-shape": "triangle",
            "arrow-scale": 1.3,
            opacity: 0.9,
          },
        },
        {
          selector: "edge:selected",
          style: {
            width: 4,
            opacity: 1,
          },
        },
        {
          selector: "edge.hover",
          style: {
            width: 4,
            opacity: 1,
          },
        },
        {
          selector: ":parent",
          style: {
            "background-opacity": 0.333,
            "background-color": colors.background,
            "border-color": colors.border,
            "border-width": 1,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR", // Left to right layout
        nodeSep: 80,
        edgeSep: 30,
        rankSep: 120,
        padding: 50,
        animate: true,
        animationDuration: 500,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      wheelSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 2,
    });

    // Enable node dragging
    cy.nodes().grabify();

    // Attach click handler to open modal
    cy.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      const node = nodes.find((n) => n.id === nodeId) || { id: nodeId };
      setSelectedNode(node);
    });

    // Add hover effects
    cy.on("mouseover", "node", (event) => {
      // Get the node's color based on its level
      let hoverColor;
      if (event.target.data("level") === 1) {
        hoverColor = colors.success;
      } else if (event.target.data("level") === 2) {
        hoverColor = colors.primary;
      } else if (event.target.data("level") === 3) {
        hoverColor = colors.secondary;
      } else if (event.target.data("level") === 4) {
        hoverColor = colors.warning;
      } else {
        hoverColor = colors.primary;
      }

      event.target.style({
        "border-color": hoverColor, // Use node's color on hover
        "border-width": 3,
        // Add shadow underlay on hover
        "shadow-blur": 15,
        "shadow-color": hoverColor,
        "shadow-opacity": 0.5,
        "shadow-offset-x": 0,
        "shadow-offset-y": 0,
      });
    });

    cy.on("mouseout", "node", (event) => {
      // Reset to black border when not hovered
      event.target.style({
        "border-color": "#000000", // Back to black
        "border-width": 3,
        "border-style": event.target.data("completed") ? "double" : "solid",
        // Reset shadow properties
        "shadow-blur": 0,
        "shadow-opacity": 0,
        "shadow-offset-x": 0,
        "shadow-offset-y": 0,
      });
    });

    // Add hover effects for edges
    cy.on("mouseover", "edge", (event) => {
      event.target.addClass("hover");
    });

    cy.on("mouseout", "edge", (event) => {
      event.target.removeClass("hover");
    });

    // Store reference for zoom controls
    cyRef.current = cy;

    // Fit the graph initially
    cy.fit(undefined, 50);

    // Cleanup on unmount
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodes, edges, theme]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom({
        level: currentZoom * 1.2,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom({
        level: currentZoom * 0.8,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
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

  return (
    <Card className="border-border bg-background text-foreground w-full overflow-hidden border shadow-md">
      <div className="border-border from-primary/5 via-secondary/5 to-background border-b bg-gradient-to-br p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="border-border bg-background/80 hover:bg-muted text-foreground"
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
                    className="border-border bg-background/80 hover:bg-muted text-foreground"
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
                    className="border-border bg-background/80 hover:bg-muted text-foreground"
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
                    className="border-border bg-background/80 hover:bg-muted text-foreground"
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
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          >
            Level 1: Basic
          </Badge>
          <Badge
            variant="outline"
            className="bg-primary/10 border-primary/30 text-primary"
          >
            Level 2: Intermediate
          </Badge>
          <Badge
            variant="outline"
            className="bg-secondary/10 border-secondary/30 text-secondary"
          >
            Level 3: Advanced
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-400"
          >
            Level 4: Mastery
          </Badge>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="bg-background h-[60vh] min-h-[400px] w-full"
          aria-label="Skill tree visualization"
        />
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            className="bg-background/80 hover:bg-muted text-foreground shadow-md"
          >
            <Info className="mr-2 size-4" />
            Click on a node for details
          </Button>
        </div>
      </div>

      {isClient && selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          open={!!selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </Card>
  );
};

export default SkillTree;
