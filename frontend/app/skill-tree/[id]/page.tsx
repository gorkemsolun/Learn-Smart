"use client";

import SkillTree from "./skill-tree";

export default function SkillTreeDemo() {
  // Custom data example
  const programmingNodes = [
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
      description:
        "Learn reusable solutions to common software design problems.",
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

  const programmingEdges = [
    { source: "basics", target: "oop" },
    { source: "basics", target: "algorithms" },
    { source: "oop", target: "design" },
    { source: "algorithms", target: "dataStructures" },
    { source: "design", target: "architecture" },
    { source: "dataStructures", target: "architecture" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-8 bg-background text-foreground min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Programming Skills Tree</h1>
        <p className="text-muted-foreground">
          Track your progress through programming concepts and skills
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        <div>
          <SkillTree
            title="Programming Skills Progression"
            nodes={programmingNodes}
            edges={programmingEdges}
          />
        </div>
      </div>
    </div>
  );
}
