import type { GameResult } from '../types';
import type { HistoryResponse } from '../types';
import { API_CONFIG, CACHE_CONFIG } from '../constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
    },
  });

  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 2000));
    return fetchWithRetry(url, retries - 1);
  }

  if (res.status >= 500 && retries > 0) {
    await new Promise(r => setTimeout(r, 1000));
    return fetchWithRetry(url, retries - 1);
  }

  return res;
}

class APICache {
  private cache: Map<string, CacheEntry<HistoryResponse>> = new Map();
  private allMatchesCache: GameResult[] = [];
  private allMatchesLoaded = false;
  private loadingPromise: Promise<GameResult[]> | null = null;
  private lastContinuation: string | undefined = undefined;
  private seenGameIds: Set<string> = new Set();

  private getKey(continuation?: string): string {
    return continuation || 'initial';
  }

  get(continuation?: string): HistoryResponse | null {
    const key = this.getKey(continuation);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_CONFIG.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(continuation: string | undefined, data: HistoryResponse): void {
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(this.getKey(continuation), {
      data,
      timestamp: Date.now(),
    });
  }

  async loadMatchesUntil(targetTimestamp: number): Promise<GameResult[]> {
    if (this.allMatchesLoaded) {
      return this.allMatchesCache;
    }

    if (!this.loadingPromise) {
      this.loadingPromise = this.fetchAllMatches(targetTimestamp);
    } else {
      await this.loadingPromise;
      if (!this.allMatchesLoaded && this.getOldestTimestamp() > targetTimestamp) {
        this.loadingPromise = this.fetchAllMatches(targetTimestamp);
      } else {
        return this.allMatchesCache;
      }
    }

    try {
      await this.loadingPromise;
      return this.allMatchesCache;
    } finally {
      this.loadingPromise = null;
    }
  }

  private getOldestTimestamp(): number {
    if (this.allMatchesCache.length === 0) return Date.now();
    return this.allMatchesCache[this.allMatchesCache.length - 1].time;
  }

  async refreshNewMatches(): Promise<GameResult[]> {
    try {
      const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/history`);
      if (!response.ok) return [];
      const json = await response.json();

      const newMatches = json.data.filter((g: GameResult) => !this.seenGameIds.has(g.gameId));
      if (newMatches.length > 0) {
        for (const match of newMatches) {
          this.seenGameIds.add(match.gameId);
        }
        this.allMatchesCache = [...newMatches, ...this.allMatchesCache];
        this.allMatchesCache.sort((a, b) => b.time - a.time);
      }
      return newMatches;
    } catch (err) {
      console.error('Failed to refresh new matches', err);
      return [];
    }
  }

  async loadAllMatches(): Promise<GameResult[]> {
    return this.loadMatchesUntil(0);
  }

  private async fetchAllMatches(targetTimestamp: number = 0): Promise<GameResult[]> {
    let continuation: string | undefined = this.lastContinuation;
    let hasMore = !this.allMatchesLoaded;
    let pagesFetched = 0;

    // Need enough pages to reach the target date. With ~7200 matches/day
    // and 300/page, even 30 days back needs ~720 pages.
    const maxPages = 700;

    while (hasMore) {
      if (this.allMatchesCache.length > 0 && this.getOldestTimestamp() <= targetTimestamp) {
        break;
      }

      if (pagesFetched >= maxPages) {
        break;
      }

      const cached = this.get(continuation);
      let response: HistoryResponse;

      if (cached) {
        response = cached;
      } else {
        const url = continuation
          ? `${API_CONFIG.BASE_URL}${continuation}`
          : `${API_CONFIG.BASE_URL}/history`;

        const res = await fetchWithRetry(url);

        if (res.status === 429) {
          console.warn('Rate limited after retries. Pausing...');
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        if (!res.ok) {
          console.warn(`API Error: ${res.status}. Stopping fetch.`);
          break;
        }

        response = await res.json();
        this.set(continuation, response);
        pagesFetched++;
      }

      const newMatches = response.data.filter(g => !this.seenGameIds.has(g.gameId));
      for (const match of newMatches) {
        this.seenGameIds.add(match.gameId);
      }
      this.allMatchesCache.push(...newMatches);
      this.allMatchesCache.sort((a, b) => b.time - a.time);

      if (response.cursor) {
        continuation = response.cursor;
        this.lastContinuation = continuation;
      } else {
        hasMore = false;
        this.allMatchesLoaded = true;
      }
    }

    return this.allMatchesCache;
  }

  getCachedMatches(): GameResult[] {
    return this.allMatchesCache;
  }

  isFullyLoaded(): boolean {
    return this.allMatchesLoaded;
  }

  clear(): void {
    this.cache.clear();
    this.allMatchesCache = [];
    this.allMatchesLoaded = false;
    this.lastContinuation = undefined;
    this.seenGameIds.clear();
  }
}

export const apiCache = new APICache();
