import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function GraphView({ graphData, onNodeClick, search }) {
  const fgRef = useRef(null);
  const [hoverNode, setHoverNode] = useState(null);

  const highlights = useMemo(() => {
    const neighbors = new Set();
    const links = new Set();

    if (!hoverNode) {
      return { neighbors, links };
    }

    graphData.links.forEach((link) => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;

      if (source === hoverNode.id || target === hoverNode.id) {
        neighbors.add(source);
        neighbors.add(target);
        links.add(link);
      }
    });

    return { neighbors, links };
  }, [graphData, hoverNode]);

  const focusedNode = useMemo(() => {
    if (!search.trim()) return null;
    const lower = search.trim().toLowerCase();
    return graphData.nodes.find((node) => node.title.toLowerCase().includes(lower)) || null;
  }, [graphData.nodes, search]);

  useEffect(() => {
    if (!focusedNode || !fgRef.current) return;

    const timeout = setTimeout(() => {
      fgRef.current.centerAt(focusedNode.x || 0, focusedNode.y || 0, 600);
      fgRef.current.zoom(2.4, 650);
    }, 240);

    return () => clearTimeout(timeout);
  }, [focusedNode]);

  return (
    <div className="h-[72vh] w-full overflow-hidden rounded-xl border border-blue-400/20 bg-slate-950">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="#020617"
        cooldownTicks={120}
        nodeLabel={(node) => node.title}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.title;
          const isFocused = node.id === focusedNode?.id;
          const isNeighbor = highlights.neighbors.has(node.id);

          const radius = isFocused ? 9 : 6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = isFocused
            ? '#38bdf8'
            : isNeighbor
              ? '#60a5fa'
              : '#2563eb';
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#38bdf8';
          ctx.fill();
          ctx.shadowBlur = 0;

          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(label, node.x + radius + 2, node.y + fontSize / 3);
        }}
        linkColor={(link) => (highlights.links.has(link) ? '#38bdf8' : '#1e3a8a')}
        linkWidth={(link) => (highlights.links.has(link) ? 2 : 1)}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={(link) => (highlights.links.has(link) ? 2 : 0)}
        onNodeHover={(node) => setHoverNode(node || null)}
        onNodeClick={(node) => onNodeClick(node)}
      />
    </div>
  );
}

export default GraphView;
