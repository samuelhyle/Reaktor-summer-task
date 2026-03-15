import type { GameResult, HistoryResponse, Move, Winner } from '../types';
import { API_CONFIG } from '../constants';

export async function fetchHistory(continuation?: string): Promise<HistoryResponse> {
  const url = continuation 
    ? `${API_CONFIG.BASE_URL}${continuation}` 
    : `${API_CONFIG.BASE_URL}/history`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export function determineWinner(playerA: Move, playerB: Move): Winner {
  if (playerA === playerB) return 'TIE';
  if (
    (playerA === 'ROCK' && playerB === 'SCISSORS') ||
    (playerA === 'SCISSORS' && playerB === 'PAPER') ||
    (playerA === 'PAPER' && playerB === 'ROCK')
  ) {
    return 'A';
  }
  return 'B';
}

export function getWinnerName(game: { playerA: { name: string; played: Move }; playerB: { name: string; played: Move } }): string {
  const winner = determineWinner(game.playerA.played, game.playerB.played);
  if (winner === 'TIE') return 'TIE';
  if (winner === 'A') return game.playerA.name;
  return game.playerB.name;
}

export function getWinnerMove(game: { playerA: { played: Move }; playerB: { played: Move } }): Move | null {
  const winner = determineWinner(game.playerA.played, game.playerB.played);
  if (winner === 'TIE') return null;
  if (winner === 'A') return game.playerA.played;
  return game.playerB.played;
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
