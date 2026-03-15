import { useState, useEffect, useMemo } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { useLeaderboard } from '../hooks/useData';
import './LeaderboardPage.css';

export function LeaderboardPage() {
  const [view, setView] = useState<'today' | 'historical'>('today');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setStartDateStr(dateStr);
    setEndDateStr(dateStr);
    setInitialized(true);
  }, []);

  const startDate = useMemo(() => {
    if (!initialized || !startDateStr) return null;
    const d = new Date(startDateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDateStr, initialized]);

  const endDate = useMemo(() => {
    if (!initialized || !endDateStr) return null;
    const d = new Date(endDateStr + 'T23:59:59');
    return d;
  }, [endDateStr, initialized]);

  const { leaderboard, loading, error } = useLeaderboard(startDate, endDate);

  const handleTodayView = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setStartDateStr(dateStr);
    setEndDateStr(dateStr);
    setView('today');
  };

  const handleHistoricalView = () => {
    setView('historical');
  };

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="error">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="leaderboard-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>Leaderboard</h1>
      </div>

      <div className="leaderboard-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'today' ? 'active' : ''}`}
            onClick={handleTodayView}
          >
            Today's Leaderboard
          </button>
          <button
            className={`toggle-btn ${view === 'historical' ? 'active' : ''}`}
            onClick={handleHistoricalView}
          >
            Historical Leaderboard
          </button>
        </div>

        {view === 'historical' && (
          <div className="date-range">
            <div className="date-field">
              <label>Start Date</label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>End Date</label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <Leaderboard
        players={leaderboard}
        loading={loading}
        title={view === 'today' ? "Today's Top Players" : 'Historical Rankings'}
      />
    </div>
  );
}
