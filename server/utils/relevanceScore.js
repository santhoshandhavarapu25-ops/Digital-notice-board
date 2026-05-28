/**
 * AI-based Relevance Scoring Algorithm
 * Ranks notices based on user profile and engagement patterns
 */

const calculateRelevanceScore = (notice, user, subscriptions, readLogs) => {
  const weights = {
    departmentMatch: 3.0,
    subscriptionMatch: 2.5,
    priority: 2.0,
    recency: 1.5,
    unread: 1.0,
    pinned: 5.0
  };

  let score = 0;

  // Pinned notices always on top
  if (notice.isPinned) {
    score += weights.pinned;
  }

  // Department match
  if (notice.department === user.department || notice.department === 'General') {
    score += weights.departmentMatch;
  }

  // Subscription match
  const subscribedCategoryIds = subscriptions.map(s => s.category.toString());
  if (notice.category && subscribedCategoryIds.includes(notice.category.toString())) {
    score += weights.subscriptionMatch;
  }

  // Priority weight
  const priorityScores = { urgent: 1.0, high: 0.75, medium: 0.5, low: 0.25 };
  score += weights.priority * (priorityScores[notice.priority] || 0.5);

  // Recency score (exponential decay over 7 days)
  const ageInHours = (Date.now() - new Date(notice.createdAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.exp(-ageInHours / (7 * 24)); // half-life of ~7 days
  score += weights.recency * recencyScore;

  // Unread bonus
  const readNoticeIds = readLogs.map(r => r.notice.toString());
  if (!readNoticeIds.includes(notice._id.toString())) {
    score += weights.unread;
  }

  return score;
};

const rankNotices = (notices, user, subscriptions, readLogs) => {
  const scoredNotices = notices.map(notice => ({
    ...notice.toObject ? notice.toObject() : notice,
    relevanceScore: calculateRelevanceScore(notice, user, subscriptions, readLogs)
  }));

  return scoredNotices.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

module.exports = { calculateRelevanceScore, rankNotices };
