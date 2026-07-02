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