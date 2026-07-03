import { ElectionRound, ElectionState, ElectionType } from './election.model';

export interface CandidateParty {
  id?: number;
  name: string;
  acronym: string;
  color?: string | null;
  active: boolean;
}

export interface CandidateElection {
  id: number;
  name: string;
  type: ElectionType;
  round: ElectionRound;
  date?: string | null;
  state: ElectionState;
}

export interface Candidate {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  vicePresidentName?: string | null;
  party?: CandidateParty;
  partyId?: number;
  election?: CandidateElection;
  electionId?: number;
  electionType: ElectionType;
  department?: string | null;
  municipality?: string | null;
  active: boolean;
  officialResultCount?: number;
  pollResultCount?: number;
  deletable?: boolean;
}

export interface CandidateCounters {
  total: number;
  active: number;
  inactive: number;
  presidency: number;
  senate: number;
  chamber: number;
  representedParties: number;
}

export interface CandidateManagement {
  counters: CandidateCounters;
  candidates: Candidate[];
  parties: CandidateParty[];
  elections: CandidateElection[];
  generatedAt: string;
}

export interface CandidateUpsertRequest {
  name: string;
  vicePresidentName?: string | null;
  partyId: number;
  electionId: number;
  electionType: ElectionType;
  department?: string | null;
  municipality?: string | null;
  active: boolean;
}
