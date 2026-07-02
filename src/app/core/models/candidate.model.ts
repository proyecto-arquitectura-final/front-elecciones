import { Party } from './party.model';
import { ElectionType } from './election.model';

export interface Candidate {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  vicePresidentName?: string;
  party?: Party;
  partyId?: number;
  electionType: ElectionType;
  department?: string;
  municipality?: string;
  active: boolean;
}
