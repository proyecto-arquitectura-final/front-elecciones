import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Poll } from '../../../core/models/poll.model';
import { OfficialResult, PredictionItem } from '../../../core/models/result.model';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { PrediccionService } from '../../../core/services/prediccion.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { Candidate } from '../../../core/models/candidate.model';
import { refreshView } from '../../../core/utils/zoneless-view.util';

interface PredictionView {
  nombre: string;
  actual: number;
  proyectado: number;
  probabilidad: number;
  incertidumbre: number;
  colorClass: 'prob-green' | 'prob-gray';
}

interface PollAverageView {
  nombre: string;
  promedio: number;
  color: string;
}

@Component({
  selector: 'app-predicciones-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predicciones-analista.html',
  styleUrl: './predicciones-analista.scss',
})
export class PrediccionesAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  tab: 'vivo' | 'encuestas' = 'vivo';
  proyecciones: PredictionView[] = [];
  promedioEncuestas: PollAverageView[] = [];
  encuestas: Poll[] = [];
  resultados: OfficialResult[] = [];
  error = '';

  constructor(
    private readonly prediccionService: PrediccionService,
    private readonly encuestaService: EncuestaService,
    private readonly resultadoService: ResultadoService,
    private readonly candidatoService: CandidatoService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get mayorProbabilidad(): number {
    return this.proyecciones.length
      ? Math.max(...this.proyecciones.map((item) => item.probabilidad))
      : 0;
  }

  get incertidumbrePromedio(): number {
    const values = this.proyecciones.map((item) => item.incertidumbre).filter((value) => value > 0);
    return values.length ? this.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }

  get chartAxis(): number[] {
    const max = Math.max(0, ...this.proyecciones.flatMap((item) => [item.actual, item.proyectado]));
    if (!max) return [0];
    const top = Math.ceil(max / 10) * 10;
    return [top, top * 0.75, top * 0.5, top * 0.25, 0].map((value) => this.round(value));
  }

  get chartScale(): number {
    return Math.max(1, this.chartAxis[0] || 1);
  }

  get metodologia() {
    const regions = new Set(this.resultados.map((item) => item.department).filter(Boolean)).size;
    const averageSample = this.encuestas.length
      ? Math.round(this.encuestas.reduce((sum, item) => sum + (item.sampleSize || 0), 0) / this.encuestas.length)
      : 0;
    const averageMargin = this.encuestas.length
      ? this.round(this.encuestas.reduce((sum, item) => sum + (item.marginError || 0), 0) / this.encuestas.length)
      : 0;
    return [
      {
        icon: '🗃',
        iconClass: 'icon-blue',
        titulo: 'Resultados parciales',
        descripcion: `${this.resultados.length} registros oficiales de ${regions} territorios`,
      },
      {
        icon: '📊',
        iconClass: 'icon-purple',
        titulo: 'Encuestas',
        descripcion: `${this.encuestas.length} encuestas con muestra promedio de ${averageSample.toLocaleString('es-CO')}`,
      },
      {
        icon: '📈',
        iconClass: 'icon-green',
        titulo: 'Candidatos modelados',
        descripcion: `${this.proyecciones.length} candidatos con resultados parciales disponibles`,
      },
      {
        icon: '↗️',
        iconClass: 'icon-orange',
        titulo: 'Margen de encuestas',
        descripcion: this.encuestas.length ? `Promedio registrado de ±${averageMargin}%` : 'Sin encuestas registradas',
      },
    ];
  }

  cargar(): void {
    this.error = '';
    forkJoin({
      parciales: this.prediccionService.porResultadosParciales(),
      encuestasPred: this.prediccionService.porEncuestas(),
      encuestas: this.encuestaService.listar(),
      resultados: this.resultadoService.listar(),
      candidatos: this.candidatoService.listar(),
    })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.proyecciones = this.mapPred(data.parciales);
          this.promedioEncuestas = this.mapPoll(data.encuestasPred, data.candidatos);
          this.encuestas = data.encuestas;
          this.resultados = data.resultados;
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudieron cargar las predicciones persistidas.';
          console.error(error);
        },
      });
  }

  private mapPred(data: PredictionItem[]): PredictionView[] {
    return data.map((item) => ({
      nombre: item.candidate,
      actual: this.round(item.currentPercentage),
      proyectado: this.round(item.projectedPercentage),
      probabilidad: this.round(item.probability),
      incertidumbre: this.round(item.uncertaintyMargin),
      colorClass: item.probability >= 50 ? 'prob-green' : 'prob-gray',
    }));
  }

  private mapPoll(data: PredictionItem[], candidates: Candidate[]): PollAverageView[] {
    const colors = new Map(
      candidates.map((candidate) => [
        candidate.name,
        candidate.party?.color || '#64748b',
      ]),
    );

    return data.map((item) => ({
      nombre: item.candidate,
      promedio: this.round(item.projectedPercentage),
      color: colors.get(item.candidate) || '#64748b',
    }));
  }

  private round(value: number): number {
    return Math.round((value || 0) * 10) / 10;
  }
}
