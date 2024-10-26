"use client";

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Navbar } from "@/components/navbar";
import {NodeData, LinkData, CustomSimulationNode} from "@/app/types"

// TO-DO IN BACKEND WE NEED TO LIMIT THE NUMBER OF BRANCHES A NODE CAN HAVE
// TO-DO ADD QUIZ PARAMETERS TO NODE DATA

// Group is the depth of the node where group 0 will be the root, the example set group root
// starts with root being 1.
const nodesData: NodeData[] = [
  { id: '1', label: 'Education Core', group: 1 },
  { id: '2', label: 'Learning Styles', group: 2 },
  { id: '3', label: 'Subjects', group: 2 },
  { id: '4', label: 'Skills', group: 3 },
  { id: '5', label: 'Career Paths', group: 3 },
  { id: '6', label: 'Visual Learners', group: 4 },
  { id: '7', label: 'Aesthetic Learners', group: 4 },
  { id: '8', label: 'Math', group: 5 },
  { id: '9', label: 'Science', group: 5 },
  { id: '10', label: 'Programming', group: 6 },
  { id: '11', label: 'Leadership', group: 6 },
  { id: '12', label: 'Engineer', group: 7 },
  { id: '13', label: 'Doctor', group: 7 },
];

// Linking every link data with its child in the backend we will use heap strategy to align
// parent and child, 2*n + 1 left child, 2*n + 2 will be the right child, parent floor((n-1)/2).
const linksData: LinkData[] = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '1', target: '4' },
  { source: '1', target: '5' },
  { source: '2', target: '6' },
  { source: '2', target: '7' },
  { source: '3', target: '8' },
  { source: '3', target: '9' },
  { source: '4', target: '10' },
  { source: '4', target: '11' },
  { source: '5', target: '12' },
  { source: '5', target: '13' },
];

export default function SkillTree() {
  const svgRef = useRef<SVGSVGElement>(null!);

  const getHSLWithOpacity = (hslColor: string, opacity: number) => {
    const hsl = d3.hsl(hslColor);
    return `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${opacity})`;
  };

  const colorScale = d3.scaleOrdinal<string>(d3.schemePastel2);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const hierarchy = d3.stratify<NodeData>()
      .id((d) => d.id)
      .parentId((d) => linksData.find((link) => link.target === d.id)?.source)(nodesData)
      .descendants() as CustomSimulationNode[];

    hierarchy.forEach((node) => {
      node.id = node.data.id;
      node.label = node.data.label;
      node.group = node.data.group;
    });

    // Starts the simulation and links different hierarchical nodes together
    const simulation = d3
      .forceSimulation<CustomSimulationNode>(hierarchy)
      .force(
        'link',
        d3.forceLink<CustomSimulationNode>()
          .links(linksData.map(link => ({
            source: hierarchy.find(node => node.id === link.source)!,
            target: hierarchy.find(node => node.id === link.target)!
          })))
          .id((d) => d.id)
          .distance(40)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<CustomSimulationNode>().radius((d) => getNodeRadius(d) + 5));

    // Connectors of the circular nodes
    const link = svg
      .append('g')
      .selectAll('line')
      .data(simulation.force<d3.ForceLink<CustomSimulationNode, LinkData>>('link')!.links())
      .enter()
      .append('line')
      .attr('stroke', 'hsl(var(--foreground))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(hierarchy)
      .enter()
      .append('circle')
      .attr('r', (d) => getNodeRadius(d))
      .attr('fill', (d) => getHSLWithOpacity(colorScale(d.group.toString()), 0.95))
      .call(
        d3
          .drag<SVGCircleElement, CustomSimulationNode>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // The labels written inside the circle
    const label = svg
      .append('g')
      .selectAll('text')
      .data(hierarchy)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text((d) => d.label)
      .style('fill', 'black')
      .style('font-size', 10)
      .style('font-weight', 'light')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as CustomSimulationNode).x!)
        .attr('y1', (d) => (d.source as CustomSimulationNode).y!)
        .attr('x2', (d) => (d.target as CustomSimulationNode).x!)
        .attr('y2', (d) => (d.target as CustomSimulationNode).y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
      label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    function dragStarted(event: d3.D3DragEvent<SVGCircleElement, CustomSimulationNode, CustomSimulationNode>, d: CustomSimulationNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, CustomSimulationNode, CustomSimulationNode>, d: CustomSimulationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGCircleElement, CustomSimulationNode, CustomSimulationNode>, d: CustomSimulationNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Each child will be smaller in radius than its parent up until it reaches the threshold
    function getNodeRadius(d: CustomSimulationNode): number {
      const maxRadius = 40;
      const minRadius = 30;
      const depthFactor = 0.2;
      return Math.max(minRadius, maxRadius - d.depth * depthFactor * minRadius);
    }

    return () => {
      simulation.stop();
    };
  }, [colorScale]);

  return (
    <main>
      <Navbar />
      <svg ref={svgRef} className="w-full h-screen -mt-[8vh]" />
    </main>
  );
}
