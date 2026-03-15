import { useState, useCallback } from 'react';
import { MatchCard, MatchCardSkeleton, Modal } from '../components';
import { useLatestMatches, useMatchesByDate } from '../hooks/useData';
import { determineWinner, formatTimestamp } from '../services/api';
import { MOVE_ICONS } from '../constants';
import type { GameResult } from '../types';
import './LatestMatches.css';

export function LatestMatches() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  const date = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  
  const { matches: latestMatches, loading: latestLoading, error: latestError, nextPage, loadMore, isFullyLoaded } = useLatestMatches();
  const { matches: dateMatches, loading: dateLoading, error: dateError } = useMatchesByDate(date);

  const matches = date || selectedDate ? dateMatches : latestMatches;
  const loading = date || selectedDate ? dateLoading : latestLoading;
  const error = date || selectedDate ? dateError : latestError;

  const handleMatchClick = useCallback((game: GameResult) => {
    setSelectedGame(game);
  }, []);

  if (error) {
    return (
      <div className="latest-matches">
        <div className="error">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-matches">
      <div className="page-header">
        <h1>Latest Matches</h1>
        <span className="match-count">
          {loading ? 'Loading...' : `${matches.length} matches`}
          {isFullyLoaded && !selectedDate && <span className="loaded-badge">All loaded</span>}
        </span>
      </div>

      <div className="date-filter">
        <label htmlFor="date-picker">Filter by date:</label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
        {selectedDate && (
          <button 
            className="clear-btn"
            onClick={() => setSelectedDate('')}
          >
            Show Latest
          </button>
        )}
      </div>

      {matches.length === 0 && !loading ? (
        <div className="empty">
          {selectedDate ? 'No matches found for this date' : 'No matches found'}
        </div>
      ) : (
        <>
          <div className="matches-grid">
            {loading 
              ? Array.from({ length: 8 }).map((_, i) => <MatchCardSkeleton key={i} />)
              : matches.map(game => (
                  <MatchCard 
                    key={game.gameId} 
                    game={game} 
                    onClick={() => handleMatchClick(game)}
                  />
                ))
            }
          </div>
          
          {!selectedDate && nextPage && (
            <div className="load-more">
              <button 
                onClick={loadMore} 
                disabled={loading}
                className="load-more-btn"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        title="Match Details"
      >
        {selectedGame && (
          <div className="match-details">
            <div className="detail-row">
              <span className="detail-label">Game ID</span>
              <span className="detail-value">{selectedGame.gameId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatTimestamp(selectedGame.time)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Player A</span>
              <span className="detail-value">{selectedGame.playerA.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Move</span>
              <span className="detail-value move">
                {MOVE_ICONS[selectedGame.playerA.played]} {selectedGame.playerA.played}
              </span>
            </div>
            <div className="detail-divider"></div>
            <div className="detail-row">
              <span className="detail-label">Player B</span>
              <span className="detail-value">{selectedGame.playerB.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Move</span>
              <span className="detail-value move">
                {MOVE_ICONS[selectedGame.playerB.played]} {selectedGame.playerB.played}
              </span>
            </div>
            <div className="detail-divider"></div>
            <div className="detail-row">
              <span className="detail-label">Winner</span>
              <span className="detail-value winner">
                {determineWinner(selectedGame.playerA.played, selectedGame.playerB.played) === 'TIE' 
                  ? 'TIE' 
                  : determineWinner(selectedGame.playerA.played, selectedGame.playerB.played) === 'A' 
                    ? selectedGame.playerA.name 
                    : selectedGame.playerB.name}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
