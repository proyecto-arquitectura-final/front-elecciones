import { PublicElection } from './public-dashboard.model';

export interface PublicPredictionMetrics {
  processedPercentage: number;
  confidence: number;
  averageUncertainty: number;
  pollCount: number;
  totalSample: number;
  modelMode: 'RESULTADOS_Y_ENCUESTAS' | 'SOLO_RESULTADOS' | 'SOLO_ENCUESTAS' | 'SIN_DATOS';
  dataQuality: 'ALTA' | 'MEDIA' | 'BAJA' | 'SIN_ELECCION' | 'SIN_DATOS';
  officialWeight: number;
  pollWeight: number;
}

export interface PublicPredictionCandidate {
  rank: number;
  id: number;
  candidate: string;
  party: string;
  acronym?: string;
  color?: string;
  votes: number;
  currentPercentage: number;
  pollAverage: number;
  projectedPercentage: number;
  probability: number;
  uncertaintyMargin: number;
  trend: number;
  pollObservations: number;
}

export interface PublicPollEvidence {
  id: number;
  source: string;
  date?: string;
  sampleSize: number;
  marginError: number;
  methodology?: string;
}

export interface PredictionFactor {
  code: string;
  title: string;
  value: string;
  description: string;
  quality: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface PublicPredictionDashboard {
  election?: PublicElection;
  elections: PublicElection[];
  metrics: PublicPredictionMetrics;
  candidates: PublicPredictionCandidate[];
  polls: PublicPollEvidence[];
  factors: PredictionFactor[];
  generatedAt?: string;
}
