import type { GameResult } from '../types';
import type { HistoryResponse } from '../types';
import { API_CONFIG, CACHE_CONFIG } from '../constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
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
      // If already loading, wait for it
      await this.loadingPromise;
      if (!this.allMatchesLoaded && this.getOldestTimestamp() > targetTimestamp) {
        // Only fetch more if the previous fetch didn't reach the target timestamp
        // AND the previous fetch wasn't just stopped by the 50-page limit for a DIFFERENT target
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
        },
      });
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

    // Default max pages to prevent infinite loops and rate limiting
    const maxPages = targetTimestamp === 0 ? 10 : 50;

    while (hasMore) {
      if (this.allMatchesCache.length > 0 && this.getOldestTimestamp() <= targetTimestamp) {
        break; // We reached the target timestamp
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
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
          },
        });

        if (res.status === 429) {
          console.warn('Rate limited. Stopping fetch early.');
          break;
        }

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
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
