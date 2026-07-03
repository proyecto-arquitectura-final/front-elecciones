export type PollStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface PollParty {
  id: number;
  name: string;
  acronym: string;
  color?: string | null;
}

export interface PollElection {
  id: number;
  name: string;
  type: string;
  round: string;
  date: string;
  state: string;
}

export interface PollCandidate {
  id: number;
  name: string;
  active: boolean;
  party?: PollParty | null;
  electionId: number;
}

export interface PollResult {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  candidate: PollCandidate;
  candidateId?: number;
  percentage: number;
}

export interface Poll {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  election: PollElection;
  source: string;
  date: string;
  sampleSize: number;
  marginError: number;
  methodology: string;
  status: PollStatus;
  totalPercentage: number;
  results: PollResult[];
}

export interface PollResultRequest {
  candidateId: number;
  percentage: number;
}

export interface PollUpsertRequest {
  electionId: number;
  source: string;
  date: string;
  sampleSize: number;
  marginError: number;
  methodology: string;
  status: PollStatus;
  results: PollResultRequest[];
}

export interface PollManagementCounters {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  averageSample: number;
}

export interface PollPage {
  items: Poll[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PollManagement {
  counters: PollManagementCounters;
  polls: PollPage;
  elections: PollElection[];
  candidates: PollCandidate[];
  generatedAt: string;
}

export interface PollManagementQuery {
  electionId?: number | null;
  status?: PollStatus | null;
  search?: string;
  page?: number;
  size?: number;
}

export interface PollImportResponse {
  polls: number;
  results: number;
}
