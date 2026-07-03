export type ResultValidationStatus = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';

export interface ResultParty {
  id: number;
  name: string;
  acronym: string;
  color?: string | null;
}

export interface ResultElection {
  id: number;
  name: string;
  type: string;
  round: string;
  date?: string | null;
  state: string;
}

export interface ResultCandidate {
  id: number;
  name: string;
  active: boolean;
  electionId: number;
  party?: ResultParty | null;
}

export interface OfficialResult {
  id: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  election: ResultElection;
  electionId?: number;
  candidate: ResultCandidate;
  candidateId?: number;
  department?: string | null;
  municipality?: string | null;
  votes: number;
  percentage: number;
  reportedTables: number;
  totalTables: number;
  participation: number;
  source: string;
  importedAt: string;
  validationStatus: ResultValidationStatus;
  validationMessage?: string | null;
  validatedAt?: string | null;
  validatedBy?: string | null;
}

export interface OfficialResultRequest {
  electionId: number;
  candidateId: number;
  department?: string | null;
  municipality?: string | null;
  votes: number;
  reportedTables: number;
  totalTables: number;
  participation: number;
  source?: string | null;
}

export interface ResultSummary {
  id: number;
  electionId: number;
  eligibleVoters: number;
  totalVoters: number;
  validVotes: number;
  blankVotes: number;
  nullVotes: number;
  unmarkedVotes: number;
  reportedTables: number;
  totalTables: number;
  tablePercentage: number;
  participation: number;
  source: string;
  importedAt: string;
}

export interface ResultSummaryRequest {
  electionId: number;
  eligibleVoters: number;
  totalVoters: number;
  validVotes: number;
  blankVotes: number;
  nullVotes: number;
  unmarkedVotes: number;
  reportedTables: number;
  totalTables: number;
  source?: string | null;
  importedAt?: string | null;
}

export interface ResultStatusOption {
  value: ResultValidationStatus;
  label: string;
}

export interface ResultManagementCounters {
  records: number;
  candidateVotes: number;
  reportedTables: number;
  totalTables: number;
  tablePercentage: number;
  participation: number;
  validated: number;
  pending: number;
  rejected: number;
  traceabilityStatus: 'SIN_DATOS' | 'INCOMPLETA' | 'REQUIERE_REVISION' | 'COMPLETA';
  reconciliationDifference: number;
  reconciled: boolean;
  lastImportedAt?: string | null;
}

export interface OfficialResultPage {
  items: OfficialResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ResultManagement {
  selectedElectionId?: number | null;
  counters: ResultManagementCounters;
  summary?: ResultSummary | null;
  results: OfficialResultPage;
  elections: ResultElection[];
  candidates: ResultCandidate[];
  validationStatuses: ResultStatusOption[];
  departments: string[];
  municipalities: string[];
  generatedAt: string;
}

export interface ResultImportResponse {
  created: number;
  updated: number;
  processed: number;
}

export interface ResultValidationResponse {
  validated: number;
  rejected: number;
  recalculatedScopes: number;
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
