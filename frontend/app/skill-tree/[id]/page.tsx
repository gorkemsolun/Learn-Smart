"use client";

// SkillTree.jsx

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

// Register extensions
cytoscape.use(dagre);

// Simple Modal component
const Modal = ({ nodeId, onClose }) => {
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Node Details</h2>
        <p>
          ID: <strong>{nodeId}</strong>
        </p>
        <button
          onClick={onClose}
          style={{ marginTop: "10px", padding: "6px 12px" }}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};

const SkillTree = () => {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        { data: { id: "A" } },
        { data: { id: "B" } },
        { data: { id: "C" } },
        { data: { source: "A", target: "B" } },
        { data: { source: "A", target: "C" } },
        { data: { source: "B", target: "C" } },
      ],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#0074D9",
            label: "data(id)",
            "text-valign": "center",
            color: "#fff",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 50,
        edgeSep: 10,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
    });

    // Enable node dragging
    cy.nodes().grabify();

    // Attach click handler to open modal
    cy.nodes().forEach((node) => {
      node.on("click", () => {
        setSelectedNode(node.id());
      });
    });

    // Cleanup on unmount
    return () => {
      cy.destroy();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
      />
      {selectedNode && (
        <Modal nodeId={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </>
  );
};

export default SkillTree;

/**
 * Usage:
 * 1. Install dependencies:
 *    npm install cytoscape cytoscape-dagre react-dom
 * 2. Import and include <SkillTree /> in your React app.
 */
