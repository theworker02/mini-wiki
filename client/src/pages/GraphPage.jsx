import { useEffect, useMemo, useState } from 'react';
import AnimatedWrapper from '../components/AnimatedWrapper';
import KnowledgeGraph from '../components/KnowledgeGraph';
import NodeDetailsModal from '../components/NodeDetailsModal';
import { getPages } from '../utils/api';
import { buildKnowledgeGraph } from '../utils/graphBuilder';

function GraphPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    setLoading(true);
    getPages('')
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const graph = buildKnowledgeGraph(articles);
    return { nodes: graph.nodes.length, links: graph.links.length };
  }, [articles]);

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="glass-card rounded-2xl p-6 shadow-card">
          <h2 className="text-2xl font-bold text-slate-900">Knowledge Graph</h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore related articles as an interactive map with manual and inferred knowledge links.
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {counts.nodes} nodes • {counts.links} links
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search and focus a node"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="skeleton h-5 w-40" />
            <div className="mt-3 skeleton h-[60vh] w-full" />
          </div>
        ) : counts.nodes === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-sm text-slate-600">No graph nodes yet. Create and link pages to build the map.</p>
          </div>
        ) : (
          <KnowledgeGraph articles={articles} search={search} onNodeOpen={setSelectedNode} />
        )}
      </div>

      <NodeDetailsModal open={Boolean(selectedNode)} node={selectedNode} onClose={() => setSelectedNode(null)} />
    </AnimatedWrapper>
  );
}

export default GraphPage;
