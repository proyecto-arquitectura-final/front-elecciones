import { Candidate } from './candidate.model';

export interface PollResult {
  id?: number;
  candidate?: Candidate;
  candidateId?: number;
  percentage: number;
}

export interface Poll {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  source: string;
  date: string;
  sampleSize: number;
  marginError: number;
  methodology: string;
  results: PollResult[];
}
