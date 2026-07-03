export interface PublicElection {
  id: number;
  name: string;
  type?: string;
  round?: string;
  date?: string;
  state?: string;
}

export interface PublicSummary {
  candidateVotes: number;
  voters: number;
  eligibleVoters: number;
  validVotes: number;
  blankVotes: number;
  nullVotes: number;
  unmarkedVotes: number;
  reportedTables: number;
  totalTables: number;
  percentageTables: number;
  participation: number;
  departments: number;
  municipalities: number;
  resultRecords: number;
  consistencyDifference: number;
  consistent: boolean;
  source: string;
  lastUpdated?: string;
}

export interface PublicCandidate {
  rank: number;
  id: number;
  candidate: string;
  party: string;
  acronym?: string;
  color?: string;
  votes: number;
  percentage: number;
  gapVotes: number;
  gapPercentage: number;
}

export interface PublicTerritory {
  level: 'DEPARTAMENTO' | 'MUNICIPIO';
  department: string;
  municipality?: string;
  reportedTables: number;
  totalTables: number;
  processedPercentage: number;
  participation: number;
  leader: string;
  votes: number;
}

export interface PublicDashboardData {
  election?: PublicElection;
  elections: PublicElection[];
  summary: PublicSummary;
  candidates: PublicCandidate[];
  territories: PublicTerritory[];
}
