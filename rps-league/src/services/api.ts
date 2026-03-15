import type { GameResult, HistoryResponse, Move, Winner } from '../types';
import { API_CONFIG } from '../constants';

const VALID_MOVES: Set<string> = new Set(['ROCK', 'PAPER', 'SCISSORS']);

export function normalizeMove(move: string): Move {
  return move.toUpperCase() as Move;
}

export function isValidMove(move: string): boolean {
  return VALID_MOVES.has(move.toUpperCase());
}

export function isValidMatch(game: GameResult): boolean {
  return isValidMove(game.playerA.played) && isValidMove(game.playerB.played);
}

export async function fetchHistory(continuation?: string): Promise<HistoryResponse> {
  const url = continuation
    ? `${API_CONFIG.BASE_URL}${continuation}`
    : `${API_CONFIG.BASE_URL}/history`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
    },
  });

  if (response.status === 429) {
    // Rate limited — wait and retry
    await new Promise(r => setTimeout(r, 2000));
    return fetchHistory(continuation);
  }

  if (response.status >= 500) {
    // Server error — retry once after a delay
    await new Promise(r => setTimeout(r, 1000));
    const retry = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
      },
    });
    if (!retry.ok) {
      throw new Error(`API Error: ${retry.status}`);
    }
    return retry.json();
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export function determineWinner(playerA: Move | string, playerB: Move | string): Winner {
  const a = normalizeMove(playerA);
  const b = normalizeMove(playerB);
  if (a === b) return 'TIE';
  if (
    (a === 'ROCK' && b === 'SCISSORS') ||
    (a === 'SCISSORS' && b === 'PAPER') ||
    (a === 'PAPER' && b === 'ROCK')
  ) {
    return 'A';
  }
  return 'B';
}

export function getWinnerName(game: { playerA: { name: string; played: Move | string }; playerB: { name: string; played: Move | string } }): string {
  if (!isValidMove(game.playerA.played) || !isValidMove(game.playerB.played)) {
    return 'INVALID';
  }
  const winner = determineWinner(game.playerA.played, game.playerB.played);
  if (winner === 'TIE') return 'TIE';
  if (winner === 'A') return game.playerA.name;
  return game.playerB.name;
}

export function getWinnerMove(game: { playerA: { played: Move | string }; playerB: { played: Move | string } }): Move | null {
  if (!isValidMove(game.playerA.played) || !isValidMove(game.playerB.played)) return null;
  const winner = determineWinner(game.playerA.played, game.playerB.played);
  if (winner === 'TIE') return null;
  if (winner === 'A') return normalizeMove(game.playerA.played);
  return normalizeMove(game.playerB.played);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function sortByTimeDesc(games: GameResult[]): GameResult[] {
  return [...games].sort((a, b) => b.time - a.time);
}

export function mergeMatches(existing: GameResult[], newMatches: GameResult[]): GameResult[] {
  const gameIdSet = new Set(existing.map(g => g.gameId));
  const uniqueNew = newMatches.filter(g => !gameIdSet.has(g.gameId));
  const combined = [...uniqueNew, ...existing];
  return sortByTimeDesc(combined);
}
