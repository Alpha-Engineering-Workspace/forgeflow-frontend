import { describe, expect, it } from 'vitest';
import { boardLanes, destinationIndex, isUnchangedMove, previewBoard } from '@/features/milestone8/components/board-order';
const a = { id: 'a', status: 'TODO', version: 1 };
const b = { id: 'b', status: 'TODO', version: 1 };
const c = { id: 'c', status: 'TODO', version: 1 };
const d = { id: 'd', status: 'DONE', version: 2 };
const issues = [a, b, c, d];

describe('M8 board move index contract', () => {
  it('groups ordered issues without changing input order', () => {
    expect(boardLanes(issues).TODO.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(boardLanes(issues).DONE.map((item) => item.id)).toEqual(['d']);
  });
  it('calculates same-lane insertion indexes after removing moving issue', () => {
    expect(destinationIndex(issues, 'a', 'TODO', 'c')).toBe(1);
    expect(destinationIndex(issues, 'c', 'TODO', 'a')).toBe(0);
    expect(destinationIndex(issues, 'a', 'TODO', null)).toBe(2);
    expect(destinationIndex(issues, 'a', 'TODO', 'a')).toBeNull();
  });
  it('calculates cross-lane start and end and rejects unknown target', () => {
    expect(destinationIndex(issues, 'b', 'DONE', 'd')).toBe(0);
    expect(destinationIndex(issues, 'b', 'DONE')).toBe(1);
    expect(destinationIndex(issues, 'b', 'REVIEW')).toBeNull();
    expect(destinationIndex(issues, 'unknown', 'DONE')).toBeNull();
  });
  it('does not issue no-op moves and builds an optimistic snapshot without changing original/version', () => {
    expect(isUnchangedMove(issues, 'b', 'TODO', 1)).toBe(true);
    expect(isUnchangedMove(issues, 'b', 'TODO', 0)).toBe(false);
    const board = { issues, boardVersion: 9 };
    const next = previewBoard(board, 'a', 'DONE', 0);
    expect(board.issues.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(board.boardVersion).toBe(9);
    expect(next.boardVersion).toBe(9);
    expect(boardLanes(next.issues).TODO.map((item) => item.id)).toEqual(['b', 'c']);
    expect(boardLanes(next.issues).DONE.map((item) => item.id)).toEqual(['a', 'd']);
    expect(next.issues.find((item) => item.id === 'a').version).toBe(1);
  });
});
