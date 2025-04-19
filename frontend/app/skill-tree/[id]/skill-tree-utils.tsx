// Helper functions for the skill tree component

// Define CSS variables for the skill tree
export function setupCytoscapeTheme() {
  const computedStyle = getComputedStyle(document.documentElement);
  const getVariable = (name: string, fallback?: string) => {
    const value = computedStyle.getPropertyValue(name).trim();
    return value || fallback || "";
  };

  // Theme variables
  const variables = {
    "--primary": getVariable("--primary"),
    "--primary-foreground": getVariable("--primary-foreground"),
    "--secondary": getVariable("--secondary"),
    "--secondary-foreground": getVariable("--secondary-foreground"),
    "--accent": getVariable("--accent"),
    "--accent-foreground": getVariable("--accent-foreground"),
    "--muted": getVariable("--muted"),
    "--muted-foreground": getVariable("--muted-foreground"),
    "--background": getVariable("--background"),
    "--foreground": getVariable("--foreground"),
    "--border": getVariable("--border"),
    "--success": getVariable("--success", "#22c55e"),
    "--success-foreground": getVariable("--success-foreground", "#ffffff"),
    "--warning": getVariable("--warning", "#f59e0b"),
    "--warning-foreground": getVariable("--warning-foreground", "#ffffff"),
  };

  // Set CSS variables for Cytoscape
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

// Node hover effect styles
export const nodeHoverStyles = {
  "border-width": 3,
  "shadow-blur": 10,
  "shadow-color": "var(--accent)",
  "shadow-opacity": 0.8,
};

// Node default styles
export const nodeDefaultStyles = {
  "border-width": 2,
  "shadow-blur": 0,
  "shadow-opacity": 0,
};
