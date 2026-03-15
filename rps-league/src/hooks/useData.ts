import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchHistory, getDateKey, sortByTimeDesc, getWinnerName } from '../services/api';
import { apiCache } from '../services/cache';
import type { GameResult, PlayerStats, Move } from '../types';

export function useLatestMatches() {
  const [matches, setMatches] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const loadedGameIds = useRef<Set<string>>(new Set());

  const loadInitial = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetchHistory(undefined);
      const sorted = sortByTimeDesc(response.data);
      loadedGameIds.current = new Set(sorted.map(g => g.gameId));
      setMatches(sorted);
      setNextPage(response.cursor || null);
      setIsFullyLoaded(!response.cursor);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextPage || isFullyLoaded) return;
    
    try {
      const response = await fetchHistory(nextPage);
      const sorted = sortByTimeDesc(response.data);
      const newGameIds = new Set(sorted.map(g => g.gameId));
      
      const trulyNew = sorted.filter(g => !loadedGameIds.current.has(g.gameId));
      trulyNew.forEach(g => loadedGameIds.current.add(g.gameId));
      
      setMatches(prev => {
        const existing = prev.filter(g => !newGameIds.has(g.gameId));
        return sortByTimeDesc([...existing, ...sorted]);
      });
      
      setNextPage(response.cursor || null);
      setIsFullyLoaded(!response.cursor);
    } catch (err) {
      console.error('Failed to load more:', err);
    }
  }, [nextPage, isFullyLoaded]);

  const refresh = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const response = await fetchHistory(undefined);
      const sorted = sortByTimeDesc(response.data);
      
      const newMatches = sorted.filter(g => !loadedGameIds.current.has(g.gameId));
      newMatches.forEach(g => loadedGameIds.current.add(g.gameId));
      
      if (newMatches.length > 0) {
        setMatches(prev => {
          const existingIds = new Set(sorted.map(g => g.gameId));
          const existing = prev.filter(g => !existingIds.has(g.gameId));
          return sortByTimeDesc([...newMatches, ...existing]);
        });
      }
      
      setNextPage(response.cursor || null);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Failed to refresh matches');
      }
    }
  }, []);

  useEffect(() => {
    loadInitial();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadInitial]);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { 
    matches, 
    loading, 
    error, 
    nextPage: !!nextPage && !isFullyLoaded,
    loadMore,
    refetch: refresh,
    isFullyLoaded
  };
}

export function useMatchesByDate(date: Date | null) {
  const [matches, setMatches] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    if (!date) {
      setMatches([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const targetDateKey = getDateKey(date.getTime());
      
      // Load until the beginning of that date (midnight)
      const targetTime = date.getTime();
      const allMatches = await apiCache.loadMatchesUntil(targetTime);
      
      const filtered = allMatches.filter(m => getDateKey(m.time) === targetDateKey);
      
      setMatches(sortByTimeDesc(filtered));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  return { matches, loading, error, refetch: loadMatches };
}

export function useAllMatches() {
  const [matches, setMatches] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allMatches = await apiCache.loadAllMatches();
      setMatches(sortByTimeDesc(allMatches));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  return { matches, loading, error, refetch: loadMatches };
}

export function usePlayerSearch(query: string) {
  const [matches, setMatches] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const searchPlayers = useCallback(async () => {
    if (!query.trim()) {
      setMatches([]);
      setPlayerNames([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let allMatches = apiCache.getCachedMatches();
      if (allMatches.length === 0) {
        allMatches = await apiCache.loadAllMatches();
      }
      
      const lowerQuery = query.toLowerCase();
      
      const filtered = allMatches.filter(
        m => m.playerA.name.toLowerCase().includes(lowerQuery) ||
             m.playerB.name.toLowerCase().includes(lowerQuery)
      );
      
      const names = new Set<string>();
      filtered.forEach(m => {
        names.add(m.playerA.name);
        names.add(m.playerB.name);
      });
      
      setMatches(sortByTimeDesc(filtered));
      setPlayerNames(Array.from(names).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search players');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const debounce = setTimeout(searchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [searchPlayers]);

  return { matches, loading, error, playerNames };
}

export interface ExtendedPlayerStats extends PlayerStats {
  winStreak: number;
  lossStreak: number;
  moveStats: {
    ROCK: number;
    PAPER: number;
    SCISSORS: number;
  };
}

export function useLeaderboard(startDate: Date | null, endDate: Date | null) {
  const [leaderboard, setLeaderboard] = useState<ExtendedPlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!startDate && !endDate) {
      setLeaderboard([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = startDate ? startDate.getTime() : 0;
      const endTime = endDate ? endDate.getTime() : Date.now();
      
      const allMatches = await apiCache.loadMatchesUntil(startTime);
      
      const filteredMatches = allMatches.filter(m => {
        const gameTime = m.time;
        return gameTime >= startTime && gameTime <= endTime;
      });
      
      const playerStats = new Map<string, ExtendedPlayerStats>();
      
      for (const game of filteredMatches) {
        const winnerResult = getWinnerName(game);
        
        if (winnerResult === 'TIE') continue;

        const winnerName = winnerResult;
        const loserName = winnerName === game.playerA.name ? game.playerB.name : game.playerA.name;
        
        const winnerMove = winnerName === game.playerA.name ? game.playerA.played : game.playerB.played;
        const loserMove = loserName === game.playerA.name ? game.playerA.played : game.playerB.played;

        if (!playerStats.has(winnerName)) {
          playerStats.set(winnerName, createInitialStats(winnerName));
        }
        if (!playerStats.has(loserName)) {
          playerStats.set(loserName, createInitialStats(loserName));
        }

        const winnerStats = playerStats.get(winnerName)!;
        const loserStats = playerStats.get(loserName)!;

        winnerStats.wins++;
        winnerStats.moveStats[winnerMove as Move]++;
        
        loserStats.losses++;
        loserStats.moveStats[loserMove as Move]++;
      }

      const result: ExtendedPlayerStats[] = Array.from(playerStats.values()).map(stats => {
        stats.totalGames = stats.wins + stats.losses;
        stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        
        const streaks = calculateStreaks(filteredMatches, stats.name);
        stats.winStreak = streaks.win;
        stats.lossStreak = streaks.loss;
        
        return stats;
      });

      result.sort((a, b) => b.wins - a.wins);
      setLeaderboard(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await apiCache.refreshNewMatches();
      loadLeaderboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  return { leaderboard, loading, error, refetch: loadLeaderboard };
}

function createInitialStats(name: string): ExtendedPlayerStats {
  return {
    name,
    wins: 0,
    losses: 0,
    totalGames: 0,
    winRate: 0,
    winStreak: 0,
    lossStreak: 0,
    moveStats: {
      ROCK: 0,
      PAPER: 0,
      SCISSORS: 0,
    },
  };
}

function calculateStreaks(matches: GameResult[], playerName: string): { win: number; loss: number } {
  const playerMatches = matches.filter(
    m => m.playerA.name === playerName || m.playerB.name === playerName
  ).sort((a, b) => b.time - a.time);

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const game of playerMatches) {
    const isPlayerA = game.playerA.name === playerName;
    const playerMove = isPlayerA ? game.playerA.played : game.playerB.played;
    const opponentMove = isPlayerA ? game.playerB.played : game.playerA.played;

    if (playerMove === opponentMove) continue;

    const playerWins = 
      (playerMove === 'ROCK' && opponentMove === 'SCISSORS') ||
      (playerMove === 'SCISSORS' && opponentMove === 'PAPER') ||
      (playerMove === 'PAPER' && opponentMove === 'ROCK');

    if (playerWins) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  }

  return { win: maxWinStreak, loss: maxLossStreak };
}
