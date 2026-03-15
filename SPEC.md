# RPS League - Specification Document

## 1. Project Overview

- **Project Name**: RPS League Dashboard
- **Type**: Single Page Application (React + TypeScript)
- **Core Functionality**: A dashboard to view Rock-Paper-Scissors match results, player statistics, and leaderboards by consuming the legacy RPS API
- **Target Users**: Players and fans of the RPS League

## 2. UI/UX Specification

### Layout Structure

- **Header**: Fixed top navigation with logo and nav links
- **Main Content**: Centered container (max-width: 1200px)
- **Footer**: Simple footer with copyright
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Visual Design

- **Color Palette**:
  - Background: #0f0f0f (near black)
  - Surface: #1a1a1a (dark gray)
  - Surface Elevated: #252525 (lighter gray)
  - Primary: #ff4d4d (red - for Rock)
  - Secondary: #4dff4d (green - for Scissors)
  - Accent: #4d4dff (blue - for Paper)
  - Text Primary: #ffffff
  - Text Secondary: #a0a0a0
  - Border: #333333

- **Typography**:
  - Font Family: "JetBrains Mono", monospace (for gaming aesthetic)
  - Headings: 700 weight, sizes: h1=2.5rem, h2=2rem, h3=1.5rem
  - Body: 400 weight, 1rem
  - Small: 0.875rem

- **Spacing System**: 4px base unit (0.25rem)
  - xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px

- **Visual Effects**:
  - Cards: subtle box-shadow, 8px border-radius
  - Hover states: slight scale(1.02) transform
  - Transitions: 200ms ease-out
  - Glow effects on primary elements

### Components

1. **Navigation**
   - Logo (RPS League text with glow)
   - Nav links: Latest Matches, Player Search, Leaderboard
   - Active state: underline with primary color

2. **Match Card**
   - Shows gameId (truncated), timestamp
   - Player A vs Player B with their moves
   - Move icons: 🪨 Rock, 📄 Paper, ✂️ Scissors
   - Winner indicator (highlighted name)
   - Hover: elevated shadow

3. **Leaderboard Table**
   - Rank, Player Name, Wins, Losses, Win Rate
   - Sortable columns
   - Highlight top 3 with gold/silver/bronze colors

4. **Date Picker**
   - Native date input with custom styling
   - Range selector for historical leaderboard

5. **Search Input**
   - Autocomplete for player names
   - Loading state with spinner

6. **Loading States**
   - Skeleton loaders for cards
   - Spinner for actions

## 3. Functionality Specification

### Core Features

1. **Latest RPS Match Results**
   - Display most recent matches (paginated, 20 per page)
   - Auto-refresh every 30 seconds
   - Show winner for each match

2. **Match Results by Date**
   - Date picker to select a specific day
   - Filter and display all matches from that day
   - Show total match count

3. **Player Search**
   - Search input with autocomplete
   - Display all matches for a specific player
   - Show player statistics (total games, wins, losses)

4. **Today's Leaderboard**
   - Ranked list of players by number of wins today
   - Shows: rank, player name, wins, losses, win rate
   - Auto-refresh every 30 seconds

5. **Historical Leaderboard**
   - Date range picker (start date, end date)
   - Ranked list of players by wins in the date range
   - Same columns as today's leaderboard

### User Interactions

- Click nav links to switch between views
- Type in search to find players
- Select date to filter matches
- Click column headers to sort leaderboard
- Infinite scroll or "Load More" for match lists

### Data Handling

- **API Endpoints**:
  - GET /history - paginated game results
  - GET /live - SSE for live updates (optional)

- **Data Processing**:
  - Determine winner: Rock > Scissors, Scissors > Paper, Paper > Rock
  - Calculate win rates
  - Group matches by date
  - Aggregate player statistics

### Edge Cases

- Handle API errors gracefully (show error message)
- Handle empty states (no matches found)
- Handle network failures (retry button)
- Validate date inputs

## 4. Acceptance Criteria

- [ ] Can view latest match results with pagination
- [ ] Can filter matches by date
- [ ] Can search for a specific player and see their matches
- [ ] Today's leaderboard shows correct rankings based on wins
- [ ] Historical leaderboard works with date range
- [ ] UI matches specified color palette and typography
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Loading states display while fetching data
- [ ] Error states display when API fails

## 5. Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Data Fetching**: Fetch API with custom hooks
- **Date Handling**: date-fns
