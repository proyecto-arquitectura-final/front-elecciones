import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicPredictionService } from '../../core/services/public-prediction.service';
import {
  PredictionFactor,
  PublicPredictionCandidate,
  PublicPredictionDashboard,
} from '../../core/models/public-prediction.model';
import { refreshView } from '../../core/utils/zoneless-view.util';

@Component({
  selector: 'app-public-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-predictions.html',
  styleUrl: './public-predictions.scss',
})
export class PublicPredictions implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  electionId?: number;
  tab: 'MODELO' | 'ENCUESTAS' = 'MODELO';
  cargando = true;
  actualizando = false;
  error = '';
  advertencia = '';
  data: PublicPredictionDashboard = this.emptyData();

  constructor(private readonly predictionService: PublicPredictionService) {}

  ngOnInit(): void {
    this.cargar();
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar(this.electionId, true));
  }

  cargar(electionId?: number, silencioso = false): void {
    if (this.actualizando) return;
    this.actualizando = true;
    if (!silencioso && !this.data.election) this.cargando = true;
    if (!silencioso) this.error = '';
    this.advertencia = '';

    this.predictionService
      .obtener(electionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.electionId = data.election?.id;
          this.cargando = false;
          this.actualizando = false;
        },
        error: (error) => {
          const message = error?.error?.message || 'No fue posible calcular las predicciones.';
          if (silencioso && this.data.election) {
            this.advertencia = `${message} Se mantienen los últimos datos calculados.`;
          } else {
            this.error = message;
          }
          this.cargando = false;
          this.actualizando = false;
          console.error(error);
        },
      });
  }

  cambiarEleccion(): void {
    this.cargar(this.electionId);
  }

  refrescar(): void {
    this.cargar(this.electionId, true);
  }

  get title(): string {
    return this.data.election?.name || 'Predicciones electorales';
  }

  get subtitle(): string {
    const election = this.data.election;
    if (!election) return 'No hay una elección configurada';
    const date = election.date
      ? new Date(`${election.date}T00:00:00`).toLocaleDateString('es-CO', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : 'Fecha no registrada';
    return `${this.formatType(election.type)} · ${this.formatRound(election.round)} · ${date}`;
  }

  get candidates(): PublicPredictionCandidate[] {
    return this.data.candidates;
  }

  get leader(): PublicPredictionCandidate | undefined {
    return this.candidates[0];
  }

  get axis(): number[] {
    const max = Math.max(
      0,
      ...this.candidates.flatMap((candidate) => [candidate.currentPercentage, candidate.projectedPercentage]),
    );
    if (!max) return [0];
    const top = Math.max(10, Math.ceil(max / 10) * 10);
    return [top, top * 0.75, top * 0.5, top * 0.25, 0].map((value) => this.round(value));
  }

  get axisMax(): number {
    return Math.max(1, this.axis[0] || 1);
  }

  get modelLabel(): string {
    switch (this.data.metrics.modelMode) {
      case 'RESULTADOS_Y_ENCUESTAS': return 'Modelo combinado';
      case 'SOLO_RESULTADOS': return 'Solo resultados parciales';
      case 'SOLO_ENCUESTAS': return 'Solo encuestas';
      default: return 'Sin datos suficientes';
    }
  }

  get qualityLabel(): string {
    switch (this.data.metrics.dataQuality) {
      case 'ALTA': return 'Calidad alta';
      case 'MEDIA': return 'Calidad media';
      case 'BAJA': return 'Calidad baja';
      default: return 'Sin evaluación';
    }
  }

  get qualityClass(): string {
    switch (this.data.metrics.dataQuality) {
      case 'ALTA': return 'quality--high';
      case 'MEDIA': return 'quality--medium';
      default: return 'quality--low';
    }
  }

  get generatedAtText(): string {
    if (!this.data.generatedAt) return 'Sin cálculo registrado';
    return new Date(this.data.generatedAt).toLocaleString('es-CO', {
      dateStyle: 'medium', timeStyle: 'short',
    });
  }

  factorIcon(factor: PredictionFactor): string {
    switch (factor.code) {
      case 'COBERTURA': return '▦';
      case 'ENCUESTAS': return '▥';
      case 'INCERTIDUMBRE': return '±';
      case 'CANDIDATOS': return '👥';
      default: return '•';
    }
  }

  factorClass(factor: PredictionFactor): string {
    switch (factor.quality) {
      case 'ALTA': return 'factor--high';
      case 'MEDIA': return 'factor--medium';
      default: return 'factor--low';
    }
  }

  barHeight(value: number): string {
    return `${Math.max(2, value / this.axisMax * 220)}px`;
  }

  trackByCandidate(_: number, candidate: PublicPredictionCandidate): number {
    return candidate.id;
  }

  formatType(value?: string): string {
    switch (value) {
      case 'PRESIDENCIA': return 'Presidencia';
      case 'SENADO': return 'Senado';
      case 'CAMARA': return 'Cámara';
      default: return value || 'Elección';
    }
  }

  formatRound(value?: string): string {
    switch (value) {
      case 'PRIMERA': return 'Primera vuelta';
      case 'SEGUNDA': return 'Segunda vuelta';
      case 'NINGUNA': return 'Vuelta única';
      default: return value || 'Sin vuelta';
    }
  }

  private round(value: number): number {
    return Math.round((value || 0) * 10) / 10;
  }

  private emptyData(): PublicPredictionDashboard {
    return {
      elections: [],
      metrics: {
        processedPercentage: 0,
        confidence: 0,
        averageUncertainty: 0,
        pollCount: 0,
        totalSample: 0,
        modelMode: 'SIN_DATOS',
        dataQuality: 'SIN_DATOS',
        officialWeight: 0,
        pollWeight: 0,
      },
      candidates: [],
      polls: [],
      factors: [],
    };
  }
}
