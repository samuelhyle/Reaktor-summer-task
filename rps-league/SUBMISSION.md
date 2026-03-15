# RPS League - Project Submission

## 1. Match Results & Leaderboards

### Q1: Who won the last match on March 9th?
**Answer:** Kwame Tanaka
*(Calculated by finding the match with the highest timestamp occurring on March 9th, 2026)*

### Q2: What are the first 10 match results for Amara Chen on February 28th?
**Answer:** WIN, LOSE, WIN, TIE, WIN, WIN, LOSE, WIN, LOSE, WIN
*(Listed in chronological order)*

### Q3: Top 10 players by wins (Earliest match until March 8th)
1. **Nia Tanaka** (314 wins)
2. **Luca Johansson** (309 wins)
3. **Yuki Chen** (307 wins)
4. **Nia Patel** (306 wins)
5. **Kwame Patel** (305 wins)
6. **Mateo Okonkwo** (304 wins)
7. **Hiroshi Kim** (302 wins)
8. **Luca Garcia** (302 wins)
9. **Amara Johansson** (301 wins)
10. **Amara Tanaka** (298 wins)

---

## 2. Technical Challenges with the "Bad API"

Working with the legacy API presented several interesting engineering challenges:

- **Aggressive Rate Limiting:** The API frequently returned `429 Too Many Requests`. I implemented a robust retry mechanism with exponential backoff in the caching layer to ensure data integrity during large fetches.
- **Inconsistent Schema Documentation:** While some documentation hinted at a `next` property for pagination, the actual API used `cursor`. Identifying this was key to making the "Load More" and historical data features work.
- **Data Anomalies:** I discovered matches with timestamps pointing to January 1970 interspersed with 2026 data. My solution includes a filtering layer to ignore these epoch-zero anomalies and focus on the valid 2026 league data.
- **CORS Restrictions:** The API does not support CORS for local development environments. I initially resolved this with a Vite proxy, but ultimately updated the app to be production-ready by allowing direct HTTPS calls where the API permits.
- **Dataset Scale:** With tens of thousands of matches, calculating leaderboards purely on the client side required a progressive loading strategy. Instead of fetching everything at once, the app fetches "chunks" of history until it has enough data to satisfy the user's date range request.

---

## 3. Future Improvements

Given more time, I would implement the following enhancements:

- **Persistent Storage:** Use `IndexedDB` to cache match results locally. This would allow the app to load instantly on subsequent visits, only fetching the "new" matches since the last sync.
- **Real-time Integration:** Utilize the `/live` Server-Sent Events (SSE) endpoint to update the Latest Matches and Leaderboard in real-time without page refreshes.
- **Virtualization:** Implement `react-window` or a similar virtualization library for the match lists to keep the DOM footprint small and the scrolling smooth, even with 10,000+ matches loaded.
- **Advanced Analytics:** Add charts showing player performance over time, common move patterns (e.g., "This player favors Rock 60% of the time"), and head-to-head comparisons.

---

## 4. Final Highlights

- **Visual Identity:** I chose a "Dark Mode" gaming aesthetic with a monospace font and glowing accents to match the "intense matches" described in the brief.
- **TypeScript First:** The entire codebase is strictly typed, ensuring that data processing for winners and stats is reliable.
- **Mobile Responsive:** The dashboard is fully responsive, utilizing a grid layout that collapses cleanly for fans checking results on their phones.
- **Performance Focused:** All heavy data processing (like leaderboard aggregation) is performed using `useMemo` and efficient Map-based lookups to prevent UI stuttering.
