import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { buildKnowledgeGraph, getConnectedNodeIds } from '../utils/graphBuilder';

function KnowledgeGraph({ articles, search, onNodeOpen }) {
  const graphRef = useRef(null);
  const [hoverNode, setHoverNode] = useState(null);

  const graphData = useMemo(() => buildKnowledgeGraph(articles), [articles]);

  const focusedNode = useMemo(() => {
    if (!search?.trim()) return null;
    const lower = search.trim().toLowerCase();
    return graphData.nodes.find((node) => node.title.toLowerCase().includes(lower)) || null;
  }, [graphData.nodes, search]);

  const highlightedNodeIds = useMemo(() => {
    if (!hoverNode) return new Set();
    const connected = getConnectedNodeIds(hoverNode.id, graphData.links);
    connected.add(hoverNode.id);
    return connected;
  }, [hoverNode, graphData.links]);

  useEffect(() => {
    if (!focusedNode || !graphRef.current) return;

    const timer = setTimeout(() => {
      graphRef.current.centerAt(focusedNode.x || 0, focusedNode.y || 0, 550);
      graphRef.current.zoom(2.2, 600);
    }, 180);

    return () => clearTimeout(timer);
  }, [focusedNode]);

  return (
    <div className="h-[74vh] w-full overflow-hidden rounded-xl border border-blue-400/20 bg-slate-950">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        backgroundColor="#020617"
        cooldownTicks={120}
        nodeLabel={(node) => `${node.title} (${node.category})`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const isHoveredOrConnected = highlightedNodeIds.has(node.id);
          const isFocused = focusedNode?.id === node.id;
          const radius = isFocused ? 9 : isHoveredOrConnected ? 7.5 : 6;

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.shadowBlur = isHoveredOrConnected || isFocused ? 18 : 10;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(node.title, node.x + radius + 2, node.y + fontSize / 3);
        }}
        linkColor={(link) => {
          const source = typeof link.source === 'object' ? link.source.id : link.source;
          const target = typeof link.target === 'object' ? link.target.id : link.target;
          const active = highlightedNodeIds.has(source) && highlightedNodeIds.has(target);

          if (link.type === 'manual') {
            return active ? '#38bdf8' : '#1d4ed8';
          }

          return active ? '#22d3ee' : '#334155';
        }}
        linkWidth={(link) => (link.type === 'manual' ? 1.8 : 1)}
        linkDirectionalParticles={(link) => (link.type === 'manual' ? 2 : 1)}
        linkDirectionalParticleWidth={(link) => (link.type === 'manual' ? 1.8 : 0.9)}
        linkDirectionalParticleSpeed={0.0035}
        onNodeHover={(node) => setHoverNode(node || null)}
        onNodeClick={(node) => {
          if (typeof onNodeOpen === 'function') {
            onNodeOpen(node);
          }
        }}
      />
    </div>
  );
}

export default KnowledgeGraph;
