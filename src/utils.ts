/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Model,
  JudgeBallot,
  ConsensusProposal,
  ApprovalBallot,
  ElectionResults,
  FinalSelection,
  ProposalStats,
  Correction,
  FatalFlaw
} from './types';

// Deterministic seed generation
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// Deterministic random number generator
export function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded shuffle helper
export function seededShuffle<T>(array: T[], seedText: string): T[] {
  const seed = xmur3(seedText)();
  const rand = mulberry32(seed);
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = out[i];
    out[i] = out[j];
    out[j] = temp;
  }
  return out;
}

// Map 0 -> "A", 1 -> "B", etc.
export function labelForIndex(i: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

// Normalize strings like "Candidate A" or "A" into "A"
export function normalizeLetter(x: any): string | null {
  if (typeof x !== 'string') return null;
  const s = x.trim().toUpperCase().replace(/CANDIDATE|OPTION|OPCIÓN/gi, '').trim();
  const match = s.match(/[A-Z]/);
  return match ? match[0] : null;
}

// Normalize ledger text
export function normalizeLedgerText(s: string): string {
  return String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.]+$/g, '');
}

// Extract JSON block between custom markers
export interface ParseResult {
  ok: boolean;
  data?: any;
  error?: string;
}

export function extractJsonBlock(raw: string, startMarker: string, endMarker: string): ParseResult {
  try {
    const start = raw.indexOf(startMarker);
    const end = raw.indexOf(endMarker);
    if (start === -1 || end === -1 || end <= start) {
      return { ok: false, error: `Missing markers ${startMarker} and/or ${endMarker}` };
    }
    let jsonText = raw.slice(start + startMarker.length, end).trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    }
    // Clean trailing commas that some LLMs output in array/objects
    jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');
    return { ok: true, data: JSON.parse(jsonText) };
  } catch (e: any) {
    return { ok: false, error: e.message || 'JSON parse error' };
  }
}

// -------------------------------------------------------------
// Election Algorithms
// -------------------------------------------------------------

export function computeBorda(candidateIds: string[], ballots: JudgeBallot[]): Record<string, number> {
  const n = candidateIds.length;
  const totals = Object.fromEntries(candidateIds.map(c => [c, 0]));
  ballots.forEach(b => {
    if (!b.ranking) return;
    b.ranking.forEach((cid, index) => {
      if (totals[cid] !== undefined) {
        totals[cid] += (n - 1 - index);
      }
    });
  });
  return totals;
}

export function computeCondorcet(
  candidateIds: string[],
  ballots: JudgeBallot[]
): { winner: string | null; matrix: Record<string, Record<string, number>> } {
  const matrix: Record<string, Record<string, number>> = {};
  candidateIds.forEach(a => {
    matrix[a] = {};
    candidateIds.forEach(b => {
      if (a !== b) matrix[a][b] = 0;
    });
  });

  ballots.forEach(ballot => {
    if (!ballot.ranking) return;
    const pos: Record<string, number> = {};
    ballot.ranking.forEach((cid, i) => (pos[cid] = i));
    candidateIds.forEach(a => {
      candidateIds.forEach(b => {
        if (a === b) return;
        const pa = pos[a] ?? 999;
        const pb = pos[b] ?? 999;
        if (pa < pb) {
          matrix[a][b] = (matrix[a][b] || 0) + 1;
        }
      });
    });
  });

  let winner: string | null = null;
  candidateIds.forEach(a => {
    const beatsAll = candidateIds.every(b => {
      if (a === b) return true;
      const votesForA = matrix[a]?.[b] ?? 0;
      const votesForB = matrix[b]?.[a] ?? 0;
      return votesForA > votesForB;
    });
    if (beatsAll) winner = a;
  });

  return { winner, matrix };
}

export function computeIRV(
  candidateIds: string[],
  ballots: JudgeBallot[]
): { winner: string | null; rounds: Array<{ active: string[]; counts: Record<string, number> }> } {
  const active = new Set(candidateIds);
  const rounds: Array<{ active: string[]; counts: Record<string, number> }> = [];

  while (active.size > 1) {
    const counts = Object.fromEntries([...active].map(cid => [cid, 0]));

    ballots.forEach(ballot => {
      if (!ballot.ranking) return;
      const firstActive = ballot.ranking.find(cid => active.has(cid));
      if (firstActive) counts[firstActive] += 1;
    });

    rounds.push({ active: [...active], counts: { ...counts } });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const majority = total / 2;
    const currentWinner = Object.entries(counts).find(([, count]) => count > majority);
    if (currentWinner) {
      return { winner: currentWinner[0], rounds };
    }

    const minCount = Math.min(...Object.values(counts));
    const losers = Object.entries(counts)
      .filter(([, c]) => c === minCount)
      .map(([cid]) => cid);

    // Tie-break elimination by lower Borda score among currently active candidates
    const borda = computeBorda([...active], ballots);
    losers.sort((a, b) => (borda[a] || 0) - (borda[b] || 0));
    const eliminated = losers[0];
    if (eliminated) {
      active.delete(eliminated);
    } else {
      break;
    }

    if (active.size === 1) break;
  }

  return { winner: [...active][0] || null, rounds };
}

export function computeFatalCounts(candidateIds: string[], ballots: JudgeBallot[]): Record<string, number> {
  const counts = Object.fromEntries(candidateIds.map(cid => [cid, 0]));
  ballots.forEach(b => {
    if (!b.fatalFlaws) return;
    const seen = new Set<string>();
    b.fatalFlaws.forEach(f => {
      if (f.severity === 'high' && counts[f.candidateId] !== undefined) {
        seen.add(f.candidateId);
      }
    });
    seen.forEach(cid => {
      counts[cid] += 1;
    });
  });
  return counts;
}

export function sortByValueDesc(obj: Record<string, number>): Array<[string, number]> {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

export function topKey(obj: Record<string, number>): string | null {
  const sorted = sortByValueDesc(obj);
  return sorted.length ? sorted[0][0] : null;
}

export function computeFirstPlace(candidateIds: string[], ballots: JudgeBallot[]): Record<string, number> {
  const counts = Object.fromEntries(candidateIds.map(cid => [cid, 0]));
  ballots.forEach(ballot => {
    const first = ballot.ranking?.[0];
    if (first && counts[first] !== undefined) counts[first] += 1;
  });
  return counts;
}

export function computeAverageRank(candidateIds: string[], ballots: JudgeBallot[]): Record<string, number> {
  const totals = Object.fromEntries(candidateIds.map(cid => [cid, 0]));
  const fallbackRank = candidateIds.length + 1;
  ballots.forEach(ballot => {
    const pos: Record<string, number> = {};
    ballot.ranking?.forEach((cid, i) => (pos[cid] = i + 1));
    candidateIds.forEach(cid => {
      totals[cid] += pos[cid] || fallbackRank;
    });
  });
  return Object.fromEntries(
    candidateIds.map(cid => [cid, ballots.length ? totals[cid] / ballots.length : fallbackRank])
  );
}

export function computeMinimax(
  candidateIds: string[],
  matrix: Record<string, Record<string, number>>
): { winner: string | null; worstDefeats: Record<string, number> } {
  const worstDefeats: Record<string, number> = {};
  candidateIds.forEach(a => {
    let worst = 0;
    candidateIds.forEach(b => {
      if (a === b) return;
      const votesForA = matrix[a]?.[b] ?? 0;
      const votesForB = matrix[b]?.[a] ?? 0;
      worst = Math.max(worst, votesForB - votesForA);
    });
    worstDefeats[a] = worst;
  });

  const sorted = [...candidateIds].sort((a, b) => worstDefeats[a] - worstDefeats[b] || a.localeCompare(b));
  return { winner: sorted[0] || null, worstDefeats };
}

export function computeElections(candidateIds: string[], ballots: JudgeBallot[]): ElectionResults {
  const borda = computeBorda(candidateIds, ballots);
  const firstPlace = computeFirstPlace(candidateIds, ballots);
  const averageRank = computeAverageRank(candidateIds, ballots);
  const condorcet = computeCondorcet(candidateIds, ballots);
  const minimax = computeMinimax(candidateIds, condorcet.matrix);
  const irv = computeIRV(candidateIds, ballots);
  const fatalCounts = computeFatalCounts(candidateIds, ballots);

  const methodWinners = [
    condorcet.winner,
    minimax.winner,
    irv.winner,
    topKey(borda),
    topKey(firstPlace)
  ].filter((w): w is string => !!w);

  const winnerCounts: Record<string, number> = {};
  methodWinners.forEach(w => (winnerCounts[w] = (winnerCounts[w] || 0) + 1));

  const orderedByConsensus = [...candidateIds].sort((a, b) => (
    (fatalCounts[a] || 0) - (fatalCounts[b] || 0) ||
    (minimax.worstDefeats[a] || 0) - (minimax.worstDefeats[b] || 0) ||
    (averageRank[a] || 999) - (averageRank[b] || 999) ||
    (borda[b] || 0) - (borda[a] || 0) ||
    (firstPlace[b] || 0) - (firstPlace[a] || 0) ||
    a.localeCompare(b)
  ));

  let recommendedBase = condorcet.winner || minimax.winner || orderedByConsensus[0] || candidateIds[0] || '';
  const fatalMajority = Math.floor(ballots.length / 2) + 1;
  if (fatalCounts[recommendedBase] >= fatalMajority) {
    recommendedBase = orderedByConsensus.find(cid => fatalCounts[cid] < fatalMajority) || recommendedBase;
  }

  const finalRanking = [
    recommendedBase,
    ...orderedByConsensus.filter(cid => cid !== recommendedBase)
  ].filter(Boolean);

  const runnerUps = finalRanking
    .filter(cid => cid !== recommendedBase)
    .slice(0, 2);

  const robustAgreement = methodWinners.length >= 4 && (winnerCounts[recommendedBase] || 0) >= 3;

  return {
    candidateIds,
    judgeCount: ballots.length,
    borda,
    firstPlace,
    averageRank,
    condorcet,
    minimax,
    irv,
    fatalCounts,
    methodWinners,
    winnerCounts,
    recommendedBase,
    runnerUps,
    finalRanking,
    robustAgreement
  };
}

export function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function extractMarkedBlock(raw: string, startMarker: string, endMarker: string): string {
  const start = raw.toUpperCase().indexOf(startMarker);
  const end = raw.toUpperCase().indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return raw;
  return raw.slice(start + startMarker.length, end).trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractLooseSection(raw: string, heading: string): string {
  const headings = [
    'Ranking',
    'Rank',
    'Order',
    'Best base',
    'Best candidate',
    'Worth adding',
    'Useful additions',
    'Must include',
    'Needs fixing',
    'Fix',
    'Corrections',
    'Should remove',
    'Remove',
    'Must exclude',
    'Missing from all answers',
    'Open disputes',
    'Fatal concerns',
    'Fatal flaws',
    'Synthesis guidance',
    'Best combined answer'
  ];
  const headingPattern = escapeRegex(heading);
  const nextHeadingPattern = headings
    .filter(h => h.toLowerCase() !== heading.toLowerCase())
    .map(escapeRegex)
    .join('|');
  const match = raw.match(
    new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?${headingPattern}\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*)?(?:${nextHeadingPattern})\\s*:?\\s*(?:\\n|$)|$)`, 'i')
  );
  return match?.[1]?.trim() || '';
}

function firstSection(raw: string, headings: string[]): string {
  for (const heading of headings) {
    const section = extractLooseSection(raw, heading);
    if (section) return section;
  }
  return '';
}

function parseBulletLines(section: string): string[] {
  return section
    .split('\n')
    .map(line => line.trim().replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)
    .filter(line => !/^none\.?$/i.test(line));
}

function normalizeSeverity(s: string): 'low' | 'medium' | 'high' {
  const value = s.toLowerCase();
  if (value.includes('high') || value.includes('fatal') || value.includes('material')) return 'high';
  if (value.includes('low') || value.includes('minor')) return 'low';
  return 'medium';
}

function parseRankingLetters(text: string, allowedLetters: string[]): string[] {
  const compact = text
    .replace(/candidate|option|proposal/gi, ' ')
    .replace(/[>\u2192\u2190,;|/]+/g, ' ');
  const seen = new Set<string>();
  const letters: string[] = [];
  const pattern = new RegExp(`\\b(${allowedLetters.map(escapeRegex).join('|')})\\b`, 'gi');
  Array.from(compact.matchAll(pattern)).forEach(match => {
    const letter = match[1].toUpperCase();
    if (!seen.has(letter)) {
      seen.add(letter);
      letters.push(letter);
    }
  });
  return letters;
}

function lineCandidateLetter(line: string, allowedLetters: string[]): string | null {
  const pattern = new RegExp(`^(?:candidate|option)?\\s*(${allowedLetters.map(escapeRegex).join('|')})\\s*[:-]`, 'i');
  const match = line.trim().match(pattern);
  return match ? match[1].toUpperCase() : null;
}

export function parseOneJudgeOutput(
  raw: string,
  judgeId: string,
  stage2Order: string[]
): JudgeBallot {
  const parsed = extractJsonBlock(raw, 'BEGIN_COUNCIL_JSON', 'END_COUNCIL_JSON');
  const letterToCandidate = Object.fromEntries(stage2Order.map((cid, i) => [labelForIndex(i), cid]));
  const allowedLetters = stage2Order.map((_, i) => labelForIndex(i));

  if (!parsed.ok && raw.includes('BEGIN_COUNCIL_JSON')) {
    return { judgeId, parseError: parsed.error || 'Failed to parse JSON', raw };
  }

  if (!parsed.ok) {
    const ballotText = extractMarkedBlock(raw, 'BEGIN_BALLOT', 'END_BALLOT');
    const warnings: string[] = [];
    const rankingText = firstSection(ballotText, ['Ranking', 'Rank', 'Order']) || ballotText;
    const rankingLetters = parseRankingLetters(rankingText, allowedLetters);
    const ranking = rankingLetters
      .map(letter => letterToCandidate[letter])
      .filter((cid: string | undefined): cid is string => !!cid);

    const missing = stage2Order.filter(cid => !ranking.includes(cid));
    if (missing.length) {
      ranking.push(...missing);
      warnings.push(`Ranking omitted ${missing.length} candidate(s); appended them at the end.`);
    }

    if (!rankingLetters.length) {
      return {
        judgeId,
        parseError: 'Could not find a usable ranking. Try a line like "Ranking: A > C > B".',
        raw
      };
    }

    const bestBaseText = firstSection(ballotText, ['Best base', 'Best candidate']);
    const bestBaseLetter = parseRankingLetters(bestBaseText, allowedLetters)[0] || rankingLetters[0];
    const approvedAsBase = bestBaseLetter && letterToCandidate[bestBaseLetter] ? [letterToCandidate[bestBaseLetter]] : [];

    const fatalFlaws: FatalFlaw[] = parseBulletLines(firstSection(ballotText, ['Fatal concerns', 'Fatal flaws']))
      .map(line => {
        const letter = lineCandidateLetter(line, allowedLetters);
        const candidateId = letter ? letterToCandidate[letter] : approvedAsBase[0] || '';
        return {
          candidateId,
          issue: line.replace(/^(?:candidate|option)?\s*[A-Z]\s*[:-]\s*/i, ''),
          severity: normalizeSeverity(line)
        };
      })
      .filter(item => !!item.issue && !!item.candidateId);

    const worthAdding = parseBulletLines(firstSection(ballotText, ['Worth adding', 'Useful additions', 'Must include']));
    const needsFixing = parseBulletLines(firstSection(ballotText, ['Needs fixing', 'Fix', 'Corrections']));
    const shouldRemove = parseBulletLines(firstSection(ballotText, ['Should remove', 'Remove', 'Must exclude']));
    const openDisputes = parseBulletLines(firstSection(ballotText, ['Missing from all answers', 'Open disputes']));

    const corrections: Correction[] = [
      ...worthAdding.map(text => ({ targetCandidateId: '', type: 'must_include', text, severity: 'medium' as const })),
      ...needsFixing.map(text => ({ targetCandidateId: '', type: 'must_fix', text, severity: 'medium' as const })),
      ...shouldRemove.map(text => ({ targetCandidateId: '', type: 'must_exclude', text, severity: 'medium' as const }))
    ];

    return {
      judgeId,
      parseWarnings: warnings,
      ranking,
      approvedAsBase,
      fatalFlaws,
      corrections,
      ledgerItems: {
        must_include: worthAdding,
        must_fix: needsFixing,
        must_exclude: shouldRemove,
        open_disputes: openDisputes
      },
      bestCombinedAnswer: firstSection(ballotText, ['Synthesis guidance', 'Best combined answer']),
      raw
    };
  }

  const ranking = (parsed.data.ranking || [])
    .map(normalizeLetter)
    .filter((l: string | null): l is string => !!l)
    .map((letter: string) => letterToCandidate[letter])
    .filter((cid: string | undefined): cid is string => !!cid);

  const mappedApproved = (parsed.data.approved_as_base || [])
    .map(normalizeLetter)
    .filter((l: string | null): l is string => !!l)
    .map((letter: string) => letterToCandidate[letter])
    .filter((cid: string | undefined): cid is string => !!cid);

  const mappedFatal: FatalFlaw[] = (parsed.data.fatal_flaws || []).map((item: any) => ({
    candidateId: letterToCandidate[normalizeLetter(item.candidate) || ''] || item.candidate,
    issue: item.issue || '',
    severity: item.severity || 'medium'
  }));

  const mappedCorrections: Correction[] = (parsed.data.corrections || []).map((item: any) => ({
    targetCandidateId: letterToCandidate[normalizeLetter(item.target) || ''] || item.target,
    type: item.type || '',
    text: item.text || '',
    severity: item.severity || 'medium'
  }));

  return {
    judgeId,
    ranking,
    approvedAsBase: mappedApproved,
    fatalFlaws: mappedFatal,
    corrections: mappedCorrections,
    ledgerItems: parsed.data.ledger_items || {},
    bestCombinedAnswer: parsed.data.best_combined_answer || '',
    rawJson: parsed.data,
    raw
  };
}

export function parseOneConsensusOutput(raw: string, sourceModelId: string): ConsensusProposal {
  const parsed = extractJsonBlock(raw, 'BEGIN_CONSENSUS_JSON', 'END_CONSENSUS_JSON');
  if (!parsed.ok) {
    return { sourceModelId, parseError: parsed.error || 'Failed to parse JSON', raw };
  }

  return {
    sourceModelId,
    baseCandidateUsed: parsed.data.base_candidate_used || '',
    proposalText: parsed.data.proposal_text || '',
    mustKeep: parsed.data.must_keep || [],
    changesApplied: parsed.data.changes_applied || [],
    excluded: parsed.data.excluded || [],
    ledgerComplianceNotes: parsed.data.ledger_compliance_notes || '',
    rawJson: parsed.data,
    raw
  };
}

export function parseOneApprovalOutput(
  raw: string,
  judgeId: string,
  stage4Order: string[]
): ApprovalBallot {
  const parsed = extractJsonBlock(raw, 'BEGIN_APPROVAL_JSON', 'END_APPROVAL_JSON');
  if (!parsed.ok) {
    return { judgeId, parseError: parsed.error || 'Failed to parse JSON', raw };
  }

  const letterToProposal = Object.fromEntries(stage4Order.map((pid, i) => [labelForIndex(i), pid]));

  const approved = (parsed.data.approved || [])
    .map(normalizeLetter)
    .filter((l: string | null): l is string => !!l)
    .map((letter: string) => letterToProposal[letter])
    .filter((pid: string | undefined): pid is string => !!pid);

  const scores: Record<string, number> = {};
  Object.entries(parsed.data.scores || {}).forEach(([letterRaw, value]) => {
    const letter = normalizeLetter(letterRaw);
    if (!letter) return;
    const pid = letterToProposal[letter];
    if (pid) scores[pid] = Number(value);
  });

  const bestLetter = normalizeLetter(parsed.data.best);
  const bestProposalId = bestLetter ? letterToProposal[bestLetter] || null : null;

  const vetoes = (parsed.data.vetoes || []).map((v: any) => ({
    proposalId: letterToProposal[normalizeLetter(v.proposal) || ''] || v.proposal,
    reason: v.reason || ''
  }));

  return {
    judgeId,
    approved,
    scores,
    bestProposalId,
    vetoes,
    rawJson: parsed.data,
    raw
  };
}

export function computeStage4Selection(
  proposalIds: string[],
  ballots: ApprovalBallot[],
  consensusProposals: Record<string, ConsensusProposal>
): FinalSelection | null {
  if (!proposalIds.length) return null;

  const approvalCounts = Object.fromEntries(proposalIds.map(pid => [pid, 0]));
  const scoreLists = Object.fromEntries(proposalIds.map(pid => [pid, [] as number[]]));
  const bestCounts = Object.fromEntries(proposalIds.map(pid => [pid, 0]));
  const vetoCounts = Object.fromEntries(proposalIds.map(pid => [pid, 0]));

  ballots.forEach(b => {
    (b.approved || []).forEach(pid => {
      if (approvalCounts[pid] !== undefined) approvalCounts[pid] += 1;
    });
    Object.entries(b.scores || {}).forEach(([pid, score]) => {
      if (scoreLists[pid] && !Number.isNaN(score)) {
        scoreLists[pid].push(score);
      }
    });
    if (b.bestProposalId && bestCounts[b.bestProposalId] !== undefined) {
      bestCounts[b.bestProposalId] += 1;
    }
    (b.vetoes || []).forEach(v => {
      if (vetoCounts[v.proposalId] !== undefined) {
        vetoCounts[v.proposalId] += 1;
      }
    });
  });

  const stats: Record<string, ProposalStats> = {};
  proposalIds.forEach(pid => {
    const scores = scoreLists[pid] || [];
    const text = consensusProposals[pid]?.proposalText || '';
    stats[pid] = {
      approval: approvalCounts[pid] || 0,
      median: median(scores),
      mean: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      best: bestCounts[pid] || 0,
      veto: vetoCounts[pid] || 0,
      length: text.length
    };
  });

  const sorted = [...proposalIds].sort((a, b) => {
    const A = stats[a]!;
    const B = stats[b]!;
    return (
      B.approval - A.approval ||
      B.median - A.median ||
      A.veto - B.veto ||
      B.mean - A.mean ||
      B.best - A.best ||
      A.length - B.length
    );
  });

  const winner = sorted[0] || null;

  return {
    winnerProposalId: winner,
    stats,
    sorted,
    finalAnswer: winner ? consensusProposals[winner]?.proposalText || '' : ''
  };
}
