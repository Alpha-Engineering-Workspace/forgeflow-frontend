import { STATUSES } from '@/features/milestone7/components/issue-data';

// The backend returns all issues in canonical lane/position order.
export function boardLanes(issues = []) {
  return Object.fromEntries(STATUSES.map((status) =>
    [status, issues.filter((issue) => issue.status === status)]));
}

// A drop onto a card inserts BEFORE that card. Backend indices are measured AFTER removal.
export function destinationIndex(issues, issueId, status, beforeId = null) {
  const lanes = boardLanes(issues);
  const moving = issues.find((issue) => issue.id === issueId);
  if (!moving || !STATUSES.includes(status)) return null;
  const withoutMoving = lanes[status].filter((issue) => issue.id !== issueId);
  if (beforeId === null) return withoutMoving.length;
  const index = withoutMoving.findIndex((issue) => issue.id === beforeId);
  return index === -1 ? null : index;
}

export function isUnchangedMove(issues, issueId, status, targetIndex) {
  const moving = issues.find((issue) => issue.id === issueId);
  if (!moving || moving.status !== status) return false;
  return boardLanes(issues)[status].findIndex((issue) => issue.id === issueId) === targetIndex;
}

// Temporary view while the server applies a move; no fake version increment.
export function previewBoard(board, issueId, toStatus, targetIndex) {
  if (!board || !board.issues.some((issue) => issue.id === issueId)) return board;
  const moving = board.issues.find((issue) => issue.id === issueId);
  const lanes = boardLanes(board.issues.filter((issue) => issue.id !== issueId));
  if (!lanes[toStatus] || targetIndex < 0 || targetIndex > lanes[toStatus].length) return board;
  lanes[toStatus].splice(targetIndex, 0, { ...moving, status: toStatus });
  return { ...board, issues: STATUSES.flatMap((status) => lanes[status]) };
}
