import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { PrediccionService } from '../../../core/services/prediccion.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { Poll } from '../../../core/models/poll.model';
import { OfficialResult, PredictionItem } from '../../../core/models/result.model';

interface TrendSeries {
  name: string;
  color: string;
  points: string;
  dots: Array<{ x: number; y: number }>;
}

@Component({
  selector: 'app-dashboard-analista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-analista.html',
  styleUrl: './dashboard-analista.scss',
})
export class DashboardAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  nombre = '';
  fechaHoy = new Date()
    .toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .replace(/^\w/, (char) => char.toUpperCase());
  cargando = true;
  error = '';
  encuestas: Poll[] = [];
  resultados: OfficialResult[] = [];
  predicciones: PredictionItem[] = [];
  totalCandidatos = 0;
  series: TrendSeries[] = [];
  chartLabels: Array<{ label: string; x: number }> = [];

  constructor(
    private readonly authService: AuthService,
    private readonly encuestaService: EncuestaService,
    private readonly candidatoService: CandidatoService,
    private readonly prediccionService: PrediccionService,
    private readonly resultadoService: ResultadoService,
    private readonly reporteService: ReporteService,
  ) {}

  ngOnInit(): void {
    this.nombre = this.authService.getName();
    this.actualizar();
  }

  actualizar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({
      encuestas: this.encuestaService.listar(),
      candidatos: this.candidatoService.listar(),
      predicciones: this.prediccionService.porEncuestas(),
      resultados: this.resultadoService.listar(),
    })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.encuestas = [...data.encuestas].sort(
            (a, b) => this.time(a.date) - this.time(b.date),
          );
          this.resultados = data.resultados;
          this.predicciones = data.predicciones;
          this.totalCandidatos = data.candidatos.length;
          this.buildTrend();
          this.cargando = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudo cargar el panel del analista.';
          this.cargando = false;
          console.error(error);
        },
      });
  }

  get stats() {
    return [
      {
        icon: '📋',
        iconClass: 'icon-green',
        value: String(this.encuestas.length),
        label: 'Encuestas Registradas',
        trend: `${this.encuestasValidas} cumplen criterios`,
        trendClass: 'trend-up',
      },
      {
        icon: '👥',
        iconClass: 'icon-blue',
        value: String(this.totalCandidatos),
        label: 'Candidatos Registrados',
        trend: 'Datos del backend',
        trendClass: 'trend-gray',
      },
      {
        icon: '🔮',
        iconClass: 'icon-purple',
        value: String(this.predicciones.length),
        label: 'Proyecciones Disponibles',
        trend: 'Basadas en encuestas',
        trendClass: 'trend-up',
      },
      {
        icon: '🗳',
        iconClass: 'icon-orange',
        value: this.votosTotales.toLocaleString('es-CO'),
        label: 'Votos Consolidados',
        trend: `${this.resultados.length} registros`,
        trendClass: 'trend-gray',
      },
    ];
  }

  get encuestasValidas(): number {
    return this.encuestas.filter((poll) => this.esEncuestaConsistente(poll)).length;
  }

  get muestraReferencia(): number {
    return this.encuestas.length
      ? this.encuestas.reduce((sum, poll) => sum + (poll.sampleSize || 0), 0) / this.encuestas.length
      : 0;
  }

  get margenReferencia(): number {
    return this.encuestas.length
      ? this.encuestas.reduce((sum, poll) => sum + (poll.marginError || 0), 0) / this.encuestas.length
      : 0;
  }

  get votosTotales(): number {
    return this.resultados.reduce((sum, result) => sum + (result.votes || 0), 0);
  }

  get intencionActual() {
    const latest = this.encuestas.at(-1);
    return (latest?.results || [])
      .map((result, index) => ({
        nombre: result.candidate?.name || `Candidato ${index + 1}`,
        pct: Math.round((result.percentage || 0) * 10) / 10,
        color: result.candidate?.party?.color || this.fallbackColor(index),
      }))
      .sort((a, b) => b.pct - a.pct);
  }

  get ultimaEncuesta(): Poll | undefined {
    return this.encuestas.at(-1);
  }

  get regionData() {
    const regions = new Map<string, { votes: number; candidates: Map<string, number> }>();
    for (const result of this.resultados) {
      const region = result.department || 'Sin región';
      const item = regions.get(region) || { votes: 0, candidates: new Map<string, number>() };
      item.votes += result.votes || 0;
      const candidate = result.candidate?.name || 'Sin candidato';
      item.candidates.set(candidate, (item.candidates.get(candidate) || 0) + (result.votes || 0));
      regions.set(region, item);
    }
    const maxVotes = Math.max(1, ...[...regions.values()].map((item) => item.votes));
    return [...regions.entries()]
      .map(([region, item]) => ({
        ciudad: region,
        pct: Math.round((item.votes * 1000) / maxVotes) / 10,
        votos: item.votes,
        lider: [...item.candidates.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos',
      }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 6);
  }

  get encuestasRecientes() {
    return [...this.encuestas]
      .reverse()
      .slice(0, 5)
      .map((poll) => ({
        firma: poll.source,
        fecha: poll.date,
        muestra: poll.sampleSize,
        margen: `±${poll.marginError}%`,
        confianza: this.confianzaRelativa(poll),
        estado: this.esEncuestaConsistente(poll) ? 'Consistente' : 'En revisión',
      }));
  }

  get tareas() {
    const tasks = [...this.encuestas]
      .reverse()
      .filter((poll) => !this.esEncuestaConsistente(poll))
      .slice(0, 4)
      .map((poll) => ({
        icon: '⚠',
        iconClass: 'icon-orange',
        texto: `Revisar encuesta ${poll.source} (${poll.date})`,
        prioridad: 'MEDIA',
        prioClass: 'prio-media',
      }));
    return tasks.length
      ? tasks
      : [
          {
            icon: '✔',
            iconClass: 'icon-green',
            texto: 'No hay encuestas pendientes de validación',
            prioridad: 'OK',
            prioClass: 'prio-baja',
          },
        ];
  }

  exportarResumen(): void {
    this.reporteService.descargarResultados('pdf');
  }


  private esEncuestaConsistente(poll: Poll): boolean {
    if (!this.encuestas.length) return false;
    return (poll.sampleSize || 0) >= this.muestraReferencia &&
      (poll.marginError || 0) <= this.margenReferencia;
  }

  private confianzaRelativa(poll: Poll): number {
    const maxMargin = Math.max(1, ...this.encuestas.map((item) => item.marginError || 0));
    return Math.round(Math.max(0, 100 - ((poll.marginError || 0) / maxMargin) * 100));
  }

  private buildTrend(): void {
    const polls = this.encuestas.slice(-7);
    if (!polls.length) {
      this.series = [];
      this.chartLabels = [];
      return;
    }

    const latestNames = (polls.at(-1)?.results || [])
      .slice()
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, 3)
      .map((result) => result.candidate?.name)
      .filter((name): name is string => !!name);

    const width = 620;
    const startX = 60;
    const step = polls.length > 1 ? width / (polls.length - 1) : 0;
    this.chartLabels = polls.map((poll, index) => ({
      label: new Date(`${poll.date}T00:00:00`).toLocaleDateString('es-CO', { month: 'short' }),
      x: startX + step * index,
    }));

    this.series = latestNames.map((name, seriesIndex) => {
      const color =
        polls.at(-1)?.results.find((result) => result.candidate?.name === name)?.candidate?.party?.color ||
        this.fallbackColor(seriesIndex);
      const dots = polls.map((poll, index) => {
        const value =
          poll.results.find((result) => result.candidate?.name === name)?.percentage || 0;
        return { x: startX + step * index, y: 200 - (value / 100) * 180 };
      });
      return {
        name,
        color,
        points: dots.map((dot) => `${dot.x},${dot.y}`).join(' '),
        dots,
      };
    });
  }

  private fallbackColor(index: number): string {
    const palette = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    return palette[index % palette.length];
  }

  private time(value?: string): number {
    return value ? new Date(`${value}T00:00:00`).getTime() : 0;
  }
}
