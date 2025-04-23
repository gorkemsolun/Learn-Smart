"use client";

import NodeDetailsModal from "@/app/skill-tree/[id]/node-details-modal";
import { NodeData } from "@/app/types";
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
import { useEffect, useRef, useState } from "react";

cytoscape.use(dagre);

interface SkillTreeProps {
  nodes?: NodeData[];
  edges?: { source: string; target: string }[];
  title?: string;
}

const defaultNodes: NodeData[] = [
  {
    id: "basics",
    label: "Programming Fundamentals",
    description:
      "Master the fundamental concepts that form the foundation of all programming languages.",
    level: 1,
    progress: 100,
    completed: true,
    skills: [
      "Variables",
      "Data Types",
      "Control Flow",
      "Functions",
      "Basic Algorithms",
    ],
    prerequisites: [],
  },
  {
    id: "oop",
    label: "Object-Oriented Programming & Design",
    description:
      "Learn to structure code using objects, classes, and inheritance patterns.",
    level: 2,
    progress: 75,
    completed: false,
    skills: [
      "Classes",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstraction",
    ],
    prerequisites: ["Programming Fundamentals"],
  },
  {
    id: "algorithms",
    label: "Algorithms & Data Structures",
    description:
      "Understand how to efficiently store and manipulate data with optimized algorithms.",
    level: 2,
    progress: 60,
    completed: false,
    skills: [
      "Sorting Algorithms",
      "Search Algorithms",
      "Trees",
      "Graphs",
      "Dynamic Programming",
    ],
    prerequisites: ["Programming Fundamentals"],
  },
  {
    id: "dataStructures",
    label: "Advanced Data Structures",
    description:
      "Master complex data structures for solving specialized problems.",
    level: 3,
    progress: 30,
    completed: false,
    skills: [
      "Balanced Trees",
      "Graph Algorithms",
      "Heaps",
      "Hash Tables",
      "Tries",
    ],
    prerequisites: ["Algorithms & Data Structures"],
  },
  {
    id: "design",
    label: "Design Patterns",
    description: "Learn reusable solutions to common software design problems.",
    level: 3,
    progress: 45,
    completed: false,
    skills: [
      "Creational Patterns",
      "Structural Patterns",
      "Behavioral Patterns",
      "Architectural Patterns",
    ],
    prerequisites: ["Object-Oriented Programming & Design"],
  },
  {
    id: "architecture",
    label: "System Architecture",
    description:
      "Design and implement large-scale software systems with multiple components.",
    level: 4,
    progress: 15,
    completed: false,
    skills: [
      "Distributed Systems",
      "Microservices",
      "Scalability",
      "Reliability",
      "Performance",
    ],
    prerequisites: ["Design Patterns", "Advanced Data Structures"],
  },
];

const defaultEdges = [
  { source: "basics", target: "oop" },
  { source: "basics", target: "algorithms" },
  { source: "oop", target: "design" },
  { source: "algorithms", target: "dataStructures" },
  { source: "design", target: "architecture" },
  { source: "dataStructures", target: "architecture" },
];

export default function SkillTree({
  nodes = defaultNodes,
  edges = defaultEdges,
  title = "Skill Progression Tree (this is dynamic)",
}: SkillTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyReference = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { theme, setTheme } = useTheme();

  const nodeThemeColors = {
    dark: {
      background: "#000000",
      foreground: "#ffffff",
      primary: "#4a4a4a",
      primaryForeground: "#ffffff",
      border: "#e0e0e0",
    },
    light: {
      background: "#ffffff",
      foreground: "#e0e0e0",
      primary: "#b0b0b0",
      primaryForeground: "#000000",
      border: "#2c2c2c",
    },
  };

  useEffect(() => {
    setIsClient(true);

    if (!theme) {
      setTheme("dark");
    }
  }, [theme, setTheme]);

  useEffect(() => {
    if (cyReference.current && isClient) {
      const colors =
        theme === "dark" ? nodeThemeColors.dark : nodeThemeColors.light;

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
          "border-color": colors.border,
          color: colors.primaryForeground,
          // Reset shadow properties
          "shadow-blur": 0,
          "shadow-opacity": 0,
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
          "line-color": colors.primaryForeground,
          "target-arrow-color": colors.primaryForeground,
          "target-arrow-fill": "filled",
        })
        .update();

      if (containerRef.current) {
        containerRef.current.style.backgroundColor = colors.background;
      }
    }
  }, [theme, isClient]);

  const colors =
    theme === "dark" ? nodeThemeColors.dark : nodeThemeColors.light;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

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

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "core",
          style: {
            "background-color": colors.background,
            "background-opacity": 1,
          },
        },
        {
          selector: "node",
          style: {
            "background-color": colors.background,
            "background-opacity": 0.9,
            "border-width": 3, // Consistent border width for all nodes
            "border-color": colors.border,
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
            "border-color": colors.primary,
            "border-width": 4,
            "padding-left": "18px",
            "padding-right": "18px",
            "padding-top": "12px",
            "padding-bottom": "12px",
            "shadow-blur": 15,
            "shadow-color": colors.primary,
            "shadow-opacity": 0.5,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,
          },
        },
        {
          selector: "node:active",
          style: {
            "overlay-color": colors.primary,
            "overlay-padding": 10,
            "overlay-opacity": 0.3,
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "curve-style": "straight",
            "line-color": colors.primaryForeground,
            "target-arrow-color": colors.primaryForeground,
            "target-arrow-fill": "filled", // Hollow arrow heads (white inside)
            "target-arrow-shape": "vee",
            "arrow-scale": 1.3,
            opacity: 0.9,
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

    cy.nodes().grabify();

    cy.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      const node = nodes.find((n) => n.id === nodeId) || { id: nodeId };
      setSelectedNode(node);
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
      containerRef.current.style.backgroundColor = colors.background;
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cy.destroy();
      cyReference.current = null;
    };
  }, [nodes, edges, theme]);

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

  return (
    <Card className="border-border bg-background text-foreground flex h-full w-full flex-col border shadow-md">
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
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="bg-background h-[calc(94vh-4rem)] w-full"
          aria-label="Skill tree visualization"
        />
        <div className="absolute right-4 top-4">
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
}
