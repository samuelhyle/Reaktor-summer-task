import { useState } from 'react';
import { Navigation, ErrorBoundary } from './components';
import { LatestMatches, PlayerSearch, LeaderboardPage } from './pages';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('latest');

  const renderContent = () => {
    switch (activeTab) {
      case 'latest':
        return <LatestMatches />;
      case 'search':
        return <PlayerSearch />;
      case 'leaderboard':
        return <LeaderboardPage />;
      default:
        return <LatestMatches />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">
          <div className="container">
            {renderContent()}
          </div>
        </main>
        <footer className="footer">
          <p>© 2026 RPS League by Samuel Hyle. All rights reserved.</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
