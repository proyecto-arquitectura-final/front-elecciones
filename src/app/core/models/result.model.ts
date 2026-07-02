import { Candidate } from './candidate.model';
import { Election } from './election.model';

export interface OfficialResult {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  election?: Election;
  electionId?: number;
  candidate?: Candidate;
  candidateId?: number;
  department: string;
  municipality: string;
  votes: number;
  percentage: number;
  reportedTables: number;
  totalTables: number;
  participation: number;
  source?: string;
  importedAt?: string;
}

export interface LiveSummary {
  votes: number;
  percentageTables: number;
  participation: number;
  leaders: PredictionItem[];
}

export interface PredictionItem {
  candidate: string;
  party: string;
  currentPercentage: number;
  projectedPercentage: number;
  probability: number;
  uncertaintyMargin: number;
}
