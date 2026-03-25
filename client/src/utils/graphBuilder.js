import { categoryColor, normalizeCategory } from '../data/categories';
import { getRelatedArticles } from './recommendationEngine';

function edgeKey(a, b) {
  return [a, b].sort().join('::');
}

export function buildKnowledgeGraph(articles) {
  const safeArticles = Array.isArray(articles) ? articles : [];

  const nodes = safeArticles.map((article) => {
    const category = normalizeCategory(article.category || 'General');

    return {
      id: article.id,
      title: article.title,
      summary: article.ai_summary,
      likes: article.likes || 0,
      views: article.views || 0,
      category,
      color: categoryColor(category)
    };
  });

  const manualEdgeMap = new Map();

  safeArticles.forEach((article) => {
    (article.related_articles || []).forEach((targetId) => {
      if (!safeArticles.find((candidate) => candidate.id === targetId)) return;
      const key = edgeKey(article.id, targetId);
      if (!manualEdgeMap.has(key)) {
        manualEdgeMap.set(key, {
          source: article.id,
          target: targetId,
          type: 'manual'
        });
      }
    });
  });

  const inferredEdgeMap = new Map();

  safeArticles.forEach((article) => {
    const related = getRelatedArticles(article, safeArticles)
      .filter((candidate) => candidate.recommendationScore >= 0.18)
      .slice(0, 2);

    related.forEach((candidate) => {
      const key = edgeKey(article.id, candidate.id);
      if (manualEdgeMap.has(key) || inferredEdgeMap.has(key)) return;

      inferredEdgeMap.set(key, {
        source: article.id,
        target: candidate.id,
        type: 'inferred'
      });
    });
  });

  return {
    nodes,
    links: [...manualEdgeMap.values(), ...inferredEdgeMap.values()]
  };
}

export function getConnectedNodeIds(nodeId, links) {
  const connected = new Set();

  (links || []).forEach((link) => {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;

    if (source === nodeId) connected.add(target);
    if (target === nodeId) connected.add(source);
  });

  return connected;
}
