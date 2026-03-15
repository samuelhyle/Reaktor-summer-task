// Script to fetch ALL matches from the RPS API and answer submission questions
const BASE_URL = 'https://assignments.reaktor.com';
const TOKEN = '0cREZMgoSZiQ1_RyanlrdLuROkaZpwj1';

const VALID_MOVES = new Set(['ROCK', 'PAPER', 'SCISSORS']);

function normalizeMove(move) {
  return move.toUpperCase();
}

function isValidMove(move) {
  return VALID_MOVES.has(normalizeMove(move));
}

function isValidMatch(match) {
  return isValidMove(match.playerA.played) && isValidMove(match.playerB.played);
}

async function fetchPage(continuation, retries = 0) {
  const url = continuation
    ? `${BASE_URL}${continuation}`
    : `${BASE_URL}/history`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });

  if (res.status === 429) {
    const delay = Math.min(2000 * Math.pow(2, retries), 30000);
    console.log(`Rate limited, waiting ${delay / 1000}s...`);
    await new Promise(r => setTimeout(r, delay));
    return fetchPage(continuation, retries + 1);
  }

  if (res.status >= 500) {
    if (retries < 10) {
      const delay = Math.min(1000 * Math.pow(2, retries), 15000);
      console.log(`Server error ${res.status}, retry ${retries + 1} in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchPage(continuation, retries + 1);
    }
    throw new Error(`API Error: ${res.status} after ${retries} retries`);
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function determineWinner(moveA, moveB) {
  const a = normalizeMove(moveA);
  const b = normalizeMove(moveB);
  if (a === b) return 'TIE';
  if (
    (a === 'ROCK' && b === 'SCISSORS') ||
    (a === 'SCISSORS' && b === 'PAPER') ||
    (a === 'PAPER' && b === 'ROCK')
  ) return 'A';
  return 'B';
}

async function main() {
  console.log('Fetching ALL matches from the API...');

  const allMatches = [];
  let continuation = undefined;
  let page = 0;
  const seenIds = new Set();

  while (true) {
    page++;
    const response = await fetchPage(continuation);

    let newCount = 0;
    for (const match of response.data) {
      if (!seenIds.has(match.gameId)) {
        seenIds.add(match.gameId);
        allMatches.push(match);
        newCount++;
      }
    }

    if (page % 50 === 0) {
      console.log(`Page ${page}: Total unique: ${allMatches.length}`);
    }

    if (!response.cursor) {
      console.log(`Done! Page ${page}: Total unique: ${allMatches.length}`);
      break;
    }
    continuation = response.cursor;
  }

  // Sort all matches by time ascending (chronological)
  allMatches.sort((a, b) => a.time - b.time);

  console.log(`\nTotal unique matches: ${allMatches.length}`);
  console.log(`Earliest: ${new Date(allMatches[0].time).toISOString()}`);
  console.log(`Latest: ${new Date(allMatches[allMatches.length - 1].time).toISOString()}`);

  // Analyze data quality
  const invalidMoveMatches = allMatches.filter(m => !isValidMatch(m));
  const invalidMoves = new Set();
  invalidMoveMatches.forEach(m => {
    if (!isValidMove(m.playerA.played)) invalidMoves.add(m.playerA.played);
    if (!isValidMove(m.playerB.played)) invalidMoves.add(m.playerB.played);
  });

  const bogusTimestampMatches = allMatches.filter(m => new Date(m.time).getUTCFullYear() < 2000);

  console.log(`\n--- Data Quality Report ---`);
  console.log(`Matches with invalid moves: ${invalidMoveMatches.length}`);
  console.log(`Invalid moves found: ${[...invalidMoves].join(', ')}`);
  console.log(`Matches with bogus timestamps (before 2000): ${bogusTimestampMatches.length}`);

  // Case-only mismatches (valid after normalization)
  const caseIssueMatches = allMatches.filter(m => {
    const a = m.playerA.played;
    const b = m.playerB.played;
    return (a !== a.toUpperCase() || b !== b.toUpperCase()) && isValidMatch(m);
  });
  console.log(`Matches with case issues (but valid moves): ${caseIssueMatches.length}`);

  // ===== Q1: Who won the last match on March 9th? =====
  console.log('\n===== Q1: Last match on March 9th =====');
  const march9Matches = allMatches.filter(m => {
    const d = new Date(m.time);
    return d.getUTCFullYear() === 2026 && d.getUTCMonth() === 2 && d.getUTCDate() === 9;
  });

  console.log(`Total matches on March 9th: ${march9Matches.length}`);

  // Filter to valid matches for determining winner
  const validMarch9 = march9Matches.filter(isValidMatch);
  console.log(`Valid matches on March 9th: ${validMarch9.length}`);

  march9Matches.sort((a, b) => a.time - b.time);
  const lastMatch = march9Matches[march9Matches.length - 1];
  const lastMatchValid = isValidMatch(lastMatch);

  if (lastMatchValid) {
    const winner = determineWinner(lastMatch.playerA.played, lastMatch.playerB.played);
    const winnerName = winner === 'TIE' ? 'TIE' : winner === 'A' ? lastMatch.playerA.name : lastMatch.playerB.name;
    console.log(`Last match: ${lastMatch.playerA.name} (${lastMatch.playerA.played}) vs ${lastMatch.playerB.name} (${lastMatch.playerB.played})`);
    console.log(`Time: ${new Date(lastMatch.time).toISOString()}`);
    console.log(`Winner: ${winnerName}`);
  } else {
    console.log(`Last match has invalid moves: ${lastMatch.playerA.played} vs ${lastMatch.playerB.played}`);
    // Still report with normalization attempt
    const winner = determineWinner(lastMatch.playerA.played, lastMatch.playerB.played);
    const winnerName = winner === 'TIE' ? 'TIE' : winner === 'A' ? lastMatch.playerA.name : lastMatch.playerB.name;
    console.log(`Last match: ${lastMatch.playerA.name} (${lastMatch.playerA.played}) vs ${lastMatch.playerB.name} (${lastMatch.playerB.played})`);
    console.log(`Time: ${new Date(lastMatch.time).toISOString()}`);
    console.log(`Winner (if normalized): ${winnerName}`);
  }

  // ===== Q2: First 10 matches for Amara Chen on Feb 28th =====
  console.log('\n===== Q2: Amara Chen on Feb 28th =====');
  const feb28Amara = allMatches.filter(m => {
    const d = new Date(m.time);
    const isFeb28 = d.getUTCFullYear() === 2026 && d.getUTCMonth() === 1 && d.getUTCDate() === 28;
    const isAmara = m.playerA.name === 'Amara Chen' || m.playerB.name === 'Amara Chen';
    return isFeb28 && isAmara;
  });

  feb28Amara.sort((a, b) => a.time - b.time);
  console.log(`Amara Chen matches on Feb 28th: ${feb28Amara.length}`);

  const first10 = feb28Amara.slice(0, 10);
  const results = first10.map(m => {
    const isPlayerA = m.playerA.name === 'Amara Chen';
    const playerMove = normalizeMove(isPlayerA ? m.playerA.played : m.playerB.played);
    const opponentMove = normalizeMove(isPlayerA ? m.playerB.played : m.playerA.played);
    const rawPlayerMove = isPlayerA ? m.playerA.played : m.playerB.played;
    const rawOpponentMove = isPlayerA ? m.playerB.played : m.playerA.played;

    // Check for invalid moves
    if (!VALID_MOVES.has(playerMove) || !VALID_MOVES.has(opponentMove)) {
      return { result: 'INVALID', rawPlayerMove, rawOpponentMove };
    }

    if (playerMove === opponentMove) return { result: 'TIE', rawPlayerMove, rawOpponentMove };
    const wins =
      (playerMove === 'ROCK' && opponentMove === 'SCISSORS') ||
      (playerMove === 'SCISSORS' && opponentMove === 'PAPER') ||
      (playerMove === 'PAPER' && opponentMove === 'ROCK');
    return { result: wins ? 'WIN' : 'LOSE', rawPlayerMove, rawOpponentMove };
  });

  first10.forEach((m, i) => {
    const isA = m.playerA.name === 'Amara Chen';
    const opponent = isA ? m.playerB.name : m.playerA.name;
    const valid = isValidMatch(m) ? '' : ' [INVALID MOVE]';
    console.log(`  ${i + 1}. ${results[i].result} - ${results[i].rawPlayerMove} vs ${results[i].rawOpponentMove} (vs ${opponent}) @ ${new Date(m.time).toISOString()}${valid}`);
  });

  const resultStrings = results.map(r => r.result);
  console.log(`\nResults: ${resultStrings.join(', ')}`);

  // ===== Q3: Top 10 by wins from earliest VALID match to end of March 8th =====
  console.log('\n===== Q3: Top 10 by wins until end of March 8th =====');

  const endOfMarch8 = new Date(Date.UTC(2026, 2, 8, 23, 59, 59, 999));
  const cutoffMatches = allMatches.filter(m => m.time <= endOfMarch8.getTime());

  console.log(`All matches until end of March 8th: ${cutoffMatches.length}`);

  // Filter to only valid matches (valid moves, normalize case)
  const validCutoff = cutoffMatches.filter(isValidMatch);
  console.log(`Valid matches until end of March 8th: ${validCutoff.length}`);

  // Also show: what if we include case-normalized matches
  const winsMap = new Map();

  for (const game of validCutoff) {
    const a = normalizeMove(game.playerA.played);
    const b = normalizeMove(game.playerB.played);
    const winner = determineWinner(a, b);
    if (winner === 'TIE') continue;

    const winnerName = winner === 'A' ? game.playerA.name : game.playerB.name;
    winsMap.set(winnerName, (winsMap.get(winnerName) || 0) + 1);
  }

  const leaderboard = Array.from(winsMap.entries())
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });

  console.log('\nTop 10 Players by Wins (valid matches only, case-normalized):');
  leaderboard.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.wins} wins`);
  });

  // Also compute with ALL matches (including invalid moves) for comparison
  const winsMapAll = new Map();
  for (const game of cutoffMatches) {
    const a = normalizeMove(game.playerA.played);
    const b = normalizeMove(game.playerB.played);
    if (a === b) continue;
    // For invalid moves, the winner determination may be incorrect
    // but let's include it for completeness
    if (!VALID_MOVES.has(a) || !VALID_MOVES.has(b)) continue; // skip invalid
    const winner = determineWinner(a, b);
    if (winner === 'TIE') continue;
    const winnerName = winner === 'A' ? game.playerA.name : game.playerB.name;
    winsMapAll.set(winnerName, (winsMapAll.get(winnerName) || 0) + 1);
  }

  // Check if bogus 1970 matches have any impact
  const pre2000 = cutoffMatches.filter(m => new Date(m.time).getUTCFullYear() < 2000);
  const validPre2000 = pre2000.filter(isValidMatch);
  console.log(`\nBogus timestamp matches (before year 2000) in range: ${pre2000.length}`);
  console.log(`Of which have valid moves: ${validPre2000.length}`);

  // Also compute excluding bogus timestamps
  const winsMapNoBogus = new Map();
  const validNoBogus = cutoffMatches.filter(m => new Date(m.time).getUTCFullYear() >= 2000 && isValidMatch(m));
  console.log(`Valid matches excluding bogus timestamps: ${validNoBogus.length}`);

  for (const game of validNoBogus) {
    const a = normalizeMove(game.playerA.played);
    const b = normalizeMove(game.playerB.played);
    const winner = determineWinner(a, b);
    if (winner === 'TIE') continue;
    const winnerName = winner === 'A' ? game.playerA.name : game.playerB.name;
    winsMapNoBogus.set(winnerName, (winsMapNoBogus.get(winnerName) || 0) + 1);
  }

  const leaderboardNoBogus = Array.from(winsMapNoBogus.entries())
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });

  console.log('\nTop 10 (excluding bogus timestamps, valid moves, normalized):');
  leaderboardNoBogus.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.wins} wins`);
  });

  // Duplicate data analysis
  let totalDupsSkipped = allMatches.length; // we already deduped
  console.log(`\n--- Duplicate Analysis ---`);
  console.log(`Pages with >300 results indicate duplicates in API responses`);

  // Write results
  const fs = await import('fs');
  const output = {
    totalMatches: allMatches.length,
    earliest: new Date(allMatches[0].time).toISOString(),
    latest: new Date(allMatches[allMatches.length - 1].time).toISOString(),
    dataQuality: {
      invalidMoveMatches: invalidMoveMatches.length,
      invalidMoves: [...invalidMoves],
      bogusTimestampMatches: bogusTimestampMatches.length,
      caseIssueMatches: caseIssueMatches.length,
    },
    q1: {
      lastMatch: {
        playerA: lastMatch.playerA,
        playerB: lastMatch.playerB,
        time: new Date(lastMatch.time).toISOString(),
        winner: (() => {
          const w = determineWinner(lastMatch.playerA.played, lastMatch.playerB.played);
          return w === 'TIE' ? 'TIE' : w === 'A' ? lastMatch.playerA.name : lastMatch.playerB.name;
        })(),
        validMoves: isValidMatch(lastMatch)
      }
    },
    q2: {
      matchCount: feb28Amara.length,
      first10Results: resultStrings,
      first10Details: first10.map((m, i) => ({
        time: new Date(m.time).toISOString(),
        playerAMove: m.playerA.played,
        playerBMove: m.playerB.played,
        opponent: m.playerA.name === 'Amara Chen' ? m.playerB.name : m.playerA.name,
        result: resultStrings[i],
        validMoves: isValidMatch(m)
      }))
    },
    q3: {
      top10: leaderboard.slice(0, 10),
      top10NoBogus: leaderboardNoBogus.slice(0, 10)
    }
  };

  fs.writeFileSync('./scripts/results.json', JSON.stringify(output, null, 2));
  console.log('\nResults saved to scripts/results.json');
}

main().catch(console.error);
