import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { PrediccionService } from '../../../core/services/prediccion.service';
import { Poll } from '../../../core/models/poll.model';
import { PredictionItem } from '../../../core/models/result.model';

@Component({
  selector: 'app-estadisticas-analista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas-analista.html',
  styleUrl: './estadisticas-analista.scss',
})
export class EstadisticasAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  encuestas: Poll[] = [];
  predicciones: PredictionItem[] = [];
  error = '';

  constructor(
    private readonly encuestaService: EncuestaService,
    private readonly prediccionService: PrediccionService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      encuestas: this.encuestaService.listar(),
      predicciones: this.prediccionService.porEncuestas(),
    })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.encuestas = [...data.encuestas].sort(
            (a, b) => this.time(a.date) - this.time(b.date),
          );
          this.predicciones = data.predicciones;
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudieron calcular las estadísticas.';
          console.error(error);
        },
      });
  }

  get promedioMargen(): number {
    return this.encuestas.length
      ? this.round(
          this.encuestas.reduce((sum, poll) => sum + (poll.marginError || 0), 0) /
            this.encuestas.length,
        )
      : 0;
  }

  get promedioMuestra(): number {
    return this.encuestas.length
      ? Math.round(
          this.encuestas.reduce((sum, poll) => sum + (poll.sampleSize || 0), 0) /
            this.encuestas.length,
        )
      : 0;
  }

  get brechaLider(): number {
    const values = [...this.predicciones].sort(
      (a, b) => b.projectedPercentage - a.projectedPercentage,
    );
    return values.length > 1
      ? this.round(values[0].projectedPercentage - values[1].projectedPercentage)
      : 0;
  }

  get stats() {
    return [
      {
        label: 'Encuestas analizadas',
        value: String(this.encuestas.length),
        trend: 'Datos persistidos',
        valueClass: '',
        trendClass: 'trend-gray',
      },
      {
        label: 'Muestra promedio',
        value: this.promedioMuestra.toLocaleString('es-CO'),
        trend: 'Personas por encuesta',
        valueClass: '',
        trendClass: 'trend-green',
      },
      {
        label: 'Margen de error promedio',
        value: `±${this.promedioMargen}%`,
        trend: this.promedioMargen <= 3 ? 'Dentro del criterio' : 'Requiere revisión',
        valueClass: this.promedioMargen <= 3 ? '' : 'orange',
        trendClass: this.promedioMargen <= 3 ? 'trend-green' : 'trend-orange',
      },
      {
        label: 'Brecha líder-segundo',
        value: `${this.brechaLider} pp`,
        trend: 'Proyección por encuestas',
        valueClass: '',
        trendClass: 'trend-gray',
      },
    ];
  }

  get seriesMargen() {
    return this.encuestas
      .slice(-8)
      .map((poll, index) => ({
        label: `E${index + 1}`,
        valor: poll.marginError || 0,
        fuente: poll.source,
      }));
  }

  get intencion() {
    return [...this.predicciones]
      .sort((a, b) => b.projectedPercentage - a.projectedPercentage)
      .map((item) => ({
        nombre: item.candidate,
        pct: this.round(item.projectedPercentage),
        probabilidad: this.round(item.probability),
        margen: this.round(item.uncertaintyMargin),
      }));
  }

  get hallazgos() {
    const leader = this.intencion[0];
    const valid = this.encuestas.filter(
      (poll) => (poll.sampleSize || 0) >= 1500 && (poll.marginError || 0) <= 3,
    ).length;
    return [
      {
        title: 'Calidad de encuestas',
        detail: `${valid} de ${this.encuestas.length} cumplen muestra mínima y margen máximo.`,
      },
      {
        title: 'Liderazgo proyectado',
        detail: leader
          ? `${leader.nombre} lidera con ${leader.pct}% proyectado.`
          : 'No hay predicciones disponibles.',
      },
      {
        title: 'Incertidumbre',
        detail: leader
          ? `El líder presenta un margen estimado de ±${leader.margen} puntos.`
          : 'Sin información suficiente.',
      },
    ];
  }

  exportar(): void {
    const payload = {
      generatedAt: new Date().toISOString(),
      stats: this.stats,
      intention: this.intencion,
      polls: this.encuestas,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'analisis-electoral.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private round(value: number): number {
    return Math.round((value || 0) * 10) / 10;
  }
  private time(value?: string): number {
    return value ? new Date(`${value}T00:00:00`).getTime() : 0;
  }
}
