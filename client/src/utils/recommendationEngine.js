function tokenize(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function overlapScore(aSet, bSet) {
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let overlap = 0;
  aSet.forEach((item) => {
    if (bSet.has(item)) overlap += 1;
  });

  const total = new Set([...aSet, ...bSet]).size;
  return total ? overlap / total : 0;
}

export function getRelatedArticles(currentArticle, allArticles) {
  if (!currentArticle || !Array.isArray(allArticles)) return [];

  const currentTags = new Set((currentArticle.tags || []).map((tag) => String(tag).toLowerCase()));
  const currentTitleTokens = tokenize(currentArticle.title);
  const currentKeywordTokens = tokenize(`${currentArticle.title} ${currentArticle.content}`);

  const ranked = allArticles
    .filter((candidate) => candidate.id !== currentArticle.id)
    .map((candidate) => {
      const candidateTags = new Set((candidate.tags || []).map((tag) => String(tag).toLowerCase()));
      const candidateTitleTokens = tokenize(candidate.title);
      const candidateKeywordTokens = tokenize(`${candidate.title} ${candidate.content}`);

      const titleSimilarity = overlapScore(currentTitleTokens, candidateTitleTokens);
      const tagSimilarity = overlapScore(currentTags, candidateTags);
      const keywordSimilarity = overlapScore(currentKeywordTokens, candidateKeywordTokens);

      const score = titleSimilarity * 0.35 + tagSimilarity * 0.35 + keywordSimilarity * 0.3;

      const reasons = [];
      if (titleSimilarity > 0.15) reasons.push('Similar title focus');
      if (tagSimilarity > 0.15) reasons.push('Overlapping tags');
      if (keywordSimilarity > 0.15) reasons.push('Shared content keywords');

      return {
        ...candidate,
        recommendationScore: Number(score.toFixed(4)),
        recommendationReasons: reasons
      };
    })
    .filter((candidate) => candidate.recommendationScore > 0.05)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);

  return ranked;
}
