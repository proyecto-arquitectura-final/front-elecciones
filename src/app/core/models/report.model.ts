export type ReportFormat = 'PDF' | 'CSV' | 'JSON';

export interface ReportElection {
  id: number;
  name: string;
  type: string;
  round: string;
  electionDate: string;
  state: string;
}

export interface ReportCounters {
  records: number;
  votes: number;
  regions: number;
  reportedTables: number;
  totalTables: number;
  processedPercentage: number;
}

export interface ReportRegion {
  region: string;
  votes: number;
  participation: number;
  reportedTables: number;
  totalTables: number;
  processedPercentage: number;
}

export interface ReportGeneration {
  id: number;
  format: ReportFormat;
  generatedAt: string;
  requestedBy: string;
  recordCount: number;
}

export interface ReportManagement {
  selectedElectionId?: number | null;
  selectedElectionName?: string | null;
  counters: ReportCounters;
  regions: ReportRegion[];
  elections: ReportElection[];
  lastGenerated: Partial<Record<ReportFormat, ReportGeneration>>;
  generatedAt: string;
}
