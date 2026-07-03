export interface AdminDashboardCounters {
  activeElections: number;
  candidates: number;
  polls: number;
  users: number;
  parties: number;
  auditEvents: number;
  resultRecords: number;
}

export interface AdminDashboardElection {
  id: number;
  name: string;
  type: 'PRESIDENCIA' | 'SENADO' | 'CAMARA' | string;
  date: string;
  state: 'CONFIGURADA' | 'ABIERTA' | 'EN_CONTEO' | 'CERRADA' | 'ARCHIVADA' | string;
  reportedTables: number;
  totalTables: number;
  progress: number | null;
  summaryAvailable: boolean;
}

export interface AdminDashboardActivity {
  id: number;
  title: string;
  detail: string;
  actor: string;
  success: boolean;
  at: string;
}

export interface AdminDashboardSystemStatus {
  code: 'SERVICES' | 'DATABASE' | 'ELECTORAL_DATA' | string;
  status: string;
  detail: string;
  level: 'SUCCESS' | 'WARNING' | 'ERROR' | string;
}

export interface AdminDashboardData {
  counters: AdminDashboardCounters;
  elections: AdminDashboardElection[];
  recentActivity: AdminDashboardActivity[];
  systemStatus: AdminDashboardSystemStatus[];
  generatedAt: string;
}
