export type ElectionType = 'PRESIDENCIA' | 'SENADO' | 'CAMARA';

export type ElectionRound = 'NINGUNA' | 'PRIMERA' | 'SEGUNDA';

export type ElectionState =
  | 'CONFIGURADA'
  | 'ABIERTA'
  | 'EN_CONTEO'
  | 'CERRADA'
  | 'ARCHIVADA';

export interface Election {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  type: ElectionType;
  round: ElectionRound;
  electionDate: string;
  state: ElectionState;
}

export interface ElectionManagementItem extends Election {
  id: number;
  reportedTables: number;
  totalTables: number;
  progress: number | null;
  summaryAvailable: boolean;
  candidateCount: number;
  officialResultCount: number;
  assistantSessionCount: number;
  structureLocked: boolean;
  deletable: boolean;
  allowedStates: ElectionState[];
}

export interface ElectionManagementCounters {
  total: number;
  configured: number;
  open: number;
  counting: number;
  closed: number;
  archived: number;
  withSummary: number;
  withoutSummary: number;
}

export interface ElectionManagement {
  counters: ElectionManagementCounters;
  elections: ElectionManagementItem[];
  generatedAt: string;
}
