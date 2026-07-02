/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Model {
  id: string;
  name: string;
  bloc: 'Western' | 'Eastern' | 'Custom';
  url: string;
}

export interface ConsensusLedger {
  baseCandidateId: string;
  runnerUpCandidateIds: string[];
  mustInclude: string[];
  mustFix: string[];
  mustExclude: string[];
  openDisputes: string[];
}

export interface FatalFlaw {
  candidateId: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Correction {
  targetCandidateId: string;
  type: 'must_include' | 'must_fix' | 'must_exclude' | 'clarity' | string;
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export interface JudgeBallot {
  judgeId: string;
  parseError?: string;
  parseWarnings?: string[];
  ranking?: string[]; // Candidate IDs ordered from best to worst
  approvedAsBase?: string[]; // Candidate IDs kept for backwards-compatible imports
  fatalFlaws?: FatalFlaw[];
  corrections?: Correction[];
  ledgerItems?: {
    must_include?: string[];
    must_fix?: string[];
    must_exclude?: string[];
    open_disputes?: string[];
  };
  bestCombinedAnswer?: string;
  rawJson?: any;
  raw: string;
}

export interface ConsensusProposal {
  sourceModelId: string;
  parseError?: string;
  baseCandidateUsed?: string;
  proposalText?: string;
  mustKeep?: string[];
  changesApplied?: Array<{ change: string; reason: string }>;
  excluded?: string[];
  ledgerComplianceNotes?: string;
  rawJson?: any;
  raw: string;
}

export interface Veto {
  proposalId: string;
  reason: string;
}

export interface ApprovalBallot {
  judgeId: string;
  parseError?: string;
  approved?: string[]; // Proposal source model IDs approved
  scores?: Record<string, number>; // Proposal source model ID -> score (0-10)
  bestProposalId?: string | null; // Proposal source model ID
  vetoes?: Veto[];
  rawJson?: any;
  raw: string;
}

export interface ElectionResults {
  candidateIds: string[];
  judgeCount: number;
  borda: Record<string, number>;
  firstPlace: Record<string, number>;
  averageRank: Record<string, number>;
  condorcet: {
    winner: string | null;
    matrix: Record<string, Record<string, number>>;
  };
  minimax: {
    winner: string | null;
    worstDefeats: Record<string, number>;
  };
  irv: {
    winner: string | null;
    rounds: Array<{
      active: string[];
      counts: Record<string, number>;
    }>;
  };
  fatalCounts: Record<string, number>;
  methodWinners: string[];
  winnerCounts: Record<string, number>;
  recommendedBase: string;
  runnerUps: string[];
  finalRanking: string[];
  robustAgreement: boolean;
}

export interface ProposalStats {
  approval: number;
  median: number;
  mean: number;
  best: number;
  veto: number;
  length: number;
}

export interface FinalSelection {
  winnerProposalId: string | null;
  stats: Record<string, ProposalStats>;
  sorted: string[];
  finalAnswer: string;
}

export interface Project {
  id: string;
  title: string;
  originalPrompt: string;
  createdAt: string;
  updatedAt: string;
  activeModelIds?: string[];
  stage1Responses: Record<string, string>; // model.id -> response
  stage2Orders: Record<string, string[]>; // judge.id -> randomized array of candidate model.ids
  stage2Raw: Record<string, string>; // judge.id -> raw text pasted
  judgeBallots: Record<string, JudgeBallot>; // judge.id -> parsed ballot
  electionResults: ElectionResults | null;
  consensusLedger: ConsensusLedger;
  stage3Raw: Record<string, string>; // model.id -> raw text pasted
  consensusProposals: Record<string, ConsensusProposal>; // model.id -> parsed proposal
  stage4Orders: Record<string, string[]>; // judge.id -> randomized array of proposal model.ids
  stage4Raw: Record<string, string>; // judge.id -> raw text pasted
  approvalBallots: Record<string, ApprovalBallot>; // judge.id -> parsed ballot
  finalSelection: FinalSelection | null;
  finalSynthesisModelId?: string;
  finalAnswerText?: string;
}

export interface WorkbenchState {
  projects: Record<string, Project>;
  activeProjectId: string | null;
  customModels: Model[];
}
