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

export function scoreValue(scoreObj: any): number | null {
  if (typeof scoreObj === 'number') return scoreObj;
  if (!scoreObj || typeof scoreObj !== 'object') return null;
  const vals = Object.values(scoreObj)
    .map(Number)
    .filter(n => !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((sum, val) => sum + val, 0) / vals.length;
}

export function computeScoreAverages(
  candidateIds: string[],
  ballots: JudgeBallot[]
): { values: Record<string, number[]>; meanByCandidate: Record<string, number> } {
  const values = Object.fromEntries(candidateIds.map(cid => [cid, [] as number[]]));

  ballots.forEach(b => {
    if (!b.scores) return;
    Object.entries(b.scores).forEach(([cid, scoreObj]) => {
      const v = scoreValue(scoreObj);
      if (v !== null && values[cid]) {
        values[cid].push(v);
      }
    });
  });

  const meanByCandidate: Record<string, number> = {};
  candidateIds.forEach(cid => {
    const arr = values[cid] || [];
    meanByCandidate[cid] = arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
  });

  return { values, meanByCandidate };
}

export function computeApproval(candidateIds: string[], ballots: JudgeBallot[]): { counts: Record<string, number> } {
  const counts = Object.fromEntries(candidateIds.map(cid => [cid, 0]));
  ballots.forEach(b => {
    if (!b.approvedAsBase) return;
    b.approvedAsBase.forEach(cid => {
      if (counts[cid] !== undefined) counts[cid] += 1;
    });
  });
  return { counts };
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

export function computeElections(candidateIds: string[], ballots: JudgeBallot[]): ElectionResults {
  const borda = computeBorda(candidateIds, ballots);
  const condorcet = computeCondorcet(candidateIds, ballots);
  const irv = computeIRV(candidateIds, ballots);
  const score = computeScoreAverages(candidateIds, ballots);
  const approval = computeApproval(candidateIds, ballots);
  const fatalCounts = computeFatalCounts(candidateIds, ballots);

  const methodWinners = [
    condorcet.winner,
    irv.winner,
    topKey(borda),
    topKey(score.meanByCandidate),
    topKey(approval.counts)
  ].filter((w): w is string => !!w);

  const winnerCounts: Record<string, number> = {};
  methodWinners.forEach(w => (winnerCounts[w] = (winnerCounts[w] || 0) + 1));

  let recommendedBase = condorcet.winner || topKey(borda) || candidateIds[0] || '';
  const fatalMajority = Math.floor(ballots.length / 2) + 1;
  if (fatalCounts[recommendedBase] >= fatalMajority) {
    const sorted = sortByValueDesc(borda).map(([cid]) => cid);
    recommendedBase = sorted.find(cid => fatalCounts[cid] < fatalMajority) || recommendedBase;
  }

  const sortedBorda = sortByValueDesc(borda);
  const runnerUps = sortedBorda
    .map(([cid]) => cid)
    .filter(cid => cid !== recommendedBase)
    .slice(0, 2);

  const robustAgreement = methodWinners.length >= 4 && (winnerCounts[recommendedBase] || 0) >= 4;

  return {
    candidateIds,
    judgeCount: ballots.length,
    borda,
    condorcet,
    irv,
    score,
    approval,
    fatalCounts,
    methodWinners,
    winnerCounts,
    recommendedBase,
    runnerUps,
    robustAgreement
  };
}

export function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function parseOneJudgeOutput(
  raw: string,
  judgeId: string,
  stage2Order: string[]
): JudgeBallot {
  const parsed = extractJsonBlock(raw, 'BEGIN_COUNCIL_JSON', 'END_COUNCIL_JSON');
  if (!parsed.ok) {
    return { judgeId, parseError: parsed.error || 'Failed to parse JSON', raw };
  }

  const letterToCandidate = Object.fromEntries(stage2Order.map((cid, i) => [labelForIndex(i), cid]));

  const ranking = (parsed.data.ranking || [])
    .map(normalizeLetter)
    .filter((l: string | null): l is string => !!l)
    .map((letter: string) => letterToCandidate[letter])
    .filter((cid: string | undefined): cid is string => !!cid);

  const mappedScores: Record<string, number | any> = {};
  Object.entries(parsed.data.scores || {}).forEach(([letterRaw, val]) => {
    const letter = normalizeLetter(letterRaw);
    if (!letter) return;
    const cid = letterToCandidate[letter];
    if (cid) mappedScores[cid] = val;
  });

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
    scores: mappedScores,
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
