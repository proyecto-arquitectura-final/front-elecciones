import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicDashboardService } from '../../core/services/public-dashboard.service';
import {
  PublicCandidate,
  PublicDashboardData,
  PublicTerritory,
} from '../../core/models/public-dashboard.model';
import { refreshView } from '../../core/utils/zoneless-view.util';

interface VoteSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard-public.html',
  styleUrl: './dashboard-public.scss',
})
export class DashboardPublic implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly palette = ['#2563eb', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  nivelTerritorial: 'DEPARTAMENTO' | 'MUNICIPIO' = 'DEPARTAMENTO';
  electionId?: number;
  cargando = true;
  actualizando = false;
  error = '';
  advertenciaActualizacion = '';
  filtroTerritorio = '';
  pagina = 1;
  readonly tamanoPagina = 10;
  data: PublicDashboardData = this.emptyData();

  constructor(private readonly dashboardService: PublicDashboardService) {}

  ngOnInit(): void {
    this.cargar();

    // Refresco silencioso para mantener el escrutinio actualizado sin recargar la página.
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar(this.electionId, true));
  }

  cambiarEleccion(): void {
    this.pagina = 1;
    this.filtroTerritorio = '';
    this.cargar(this.electionId);
  }

  cambiarNivel(): void {
    this.pagina = 1;
    this.filtroTerritorio = '';
  }

  aplicarFiltro(): void {
    this.pagina = 1;
  }

  cargar(electionId?: number, silencioso = false): void {
    if (this.actualizando) return;

    this.actualizando = true;
    if (!silencioso && !this.data.election) {
      this.cargando = true;
    }
    if (!silencioso) {
      this.error = '';
    }
    this.advertenciaActualizacion = '';

    this.dashboardService
      .obtener(electionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.electionId = data.election?.id;
          this.cargando = false;
          this.actualizando = false;
          this.advertenciaActualizacion = '';
          this.ajustarPagina();
        },
        error: (error) => {
          const message =
            error?.error?.message || 'No fue posible cargar los resultados desde la base de datos.';
          if (silencioso && this.data.election) {
            this.advertenciaActualizacion = `${message} Se conservan los últimos datos visibles.`;
          } else {
            this.error = message;
          }
          this.cargando = false;
          this.actualizando = false;
          console.error(error);
        },
      });
  }

  refrescar(): void {
    this.cargar(this.electionId, true);
  }

  exportarCsv(): void {
    window.location.assign(this.dashboardService.exportUrl(this.electionId));
  }

  get electionTitle(): string {
    return this.data.election?.name || 'Resultados electorales';
  }

  get electionSubtitle(): string {
    const election = this.data.election;
    if (!election) return 'No hay una elección configurada en la base de datos';
    const date = election.date
      ? new Date(`${election.date}T00:00:00`).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Fecha no registrada';
    return `${this.formatType(election.type)} · ${this.formatRound(election.round)} · ${date}`;
  }

  get stateLabel(): string {
    switch (this.data.election?.state) {
      case 'CONFIGURADA': return 'Configurada';
      case 'ABIERTA': return 'Votación abierta';
      case 'EN_CONTEO': return 'En escrutinio';
      case 'CERRADA': return 'Resultado cerrado';
      case 'ARCHIVADA': return 'Archivada';
      default: return 'Sin estado';
    }
  }

  get stateClass(): string {
    switch (this.data.election?.state) {
      case 'ABIERTA': return 'status--open';
      case 'EN_CONTEO': return 'status--counting';
      case 'CERRADA': return 'status--closed';
      case 'ARCHIVADA': return 'status--archived';
      default: return 'status--configured';
    }
  }

  get leaderTitle(): string {
    return ['CERRADA', 'ARCHIVADA'].includes(this.data.election?.state || '')
      ? 'Resultado consolidado'
      : 'Líder actual del escrutinio';
  }

  get candidatos(): PublicCandidate[] {
    return this.data.candidates;
  }

  get lider(): PublicCandidate | undefined {
    return this.candidatos[0];
  }

  get segundo(): PublicCandidate | undefined {
    return this.candidatos[1];
  }

  get voteSegments(): VoteSegment[] {
    const validVotes = this.data.summary.validVotes || 0;
    const segments: VoteSegment[] = this.candidatos.map((candidate, index) => ({
      label: candidate.candidate,
      value: candidate.votes,
      percentage: candidate.percentage,
      color: this.candidateColor(candidate, index),
    }));

    if (this.data.summary.blankVotes > 0) {
      segments.push({
        label: 'Voto en blanco',
        value: this.data.summary.blankVotes,
        percentage: validVotes > 0
          ? this.round(this.data.summary.blankVotes * 100 / validVotes)
          : 0,
        color: '#94a3b8',
      });
    }
    return segments;
  }

  get pieBackground(): string {
    if (!this.voteSegments.length) return 'conic-gradient(#e2e8f0 0 100%)';
    let cursor = 0;
    const pieces = this.voteSegments.map((item) => {
      const start = cursor;
      cursor += item.percentage;
      return `${item.color} ${start}% ${Math.min(100, cursor)}%`;
    });
    if (cursor < 100) pieces.push(`#e2e8f0 ${cursor}% 100%`);
    return `conic-gradient(${pieces.join(', ')})`;
  }

  get voteBreakdownSegments(): VoteSegment[] {
    const voters = this.data.summary.voters || 0;
    const classified = this.data.summary.validVotes
      + this.data.summary.nullVotes
      + this.data.summary.unmarkedVotes;
    const values = [
      { label: 'Votos válidos', value: this.data.summary.validVotes, color: '#2563eb' },
      { label: 'Votos nulos', value: this.data.summary.nullVotes, color: '#ef4444' },
      { label: 'Tarjetas no marcadas', value: this.data.summary.unmarkedVotes, color: '#f59e0b' },
    ];
    if (voters > classified) {
      values.push({ label: 'Otros / sin clasificar', value: voters - classified, color: '#94a3b8' });
    }
    return values.map((item) => ({
      ...item,
      percentage: voters > 0 ? this.round(item.value * 100 / voters) : 0,
    }));
  }

  get voteBreakdownBackground(): string {
    if (!this.data.summary.voters) return 'conic-gradient(#e2e8f0 0 100%)';
    let cursor = 0;
    return `conic-gradient(${this.voteBreakdownSegments.map((item) => {
      const start = cursor;
      cursor += item.percentage;
      return `${item.color} ${start}% ${Math.min(100, cursor)}%`;
    }).join(', ')})`;
  }

  get territoriosFiltrados(): PublicTerritory[] {
    const term = this.normalizeSearch(this.filtroTerritorio);
    return this.data.territories
      .filter((item) => item.level === this.nivelTerritorial)
      .filter((item) => {
        if (!term) return true;
        return this.normalizeSearch(`${item.department} ${item.municipality || ''} ${item.leader}`)
          .includes(term);
      });
  }

  get territoriosPagina(): PublicTerritory[] {
    const start = (this.pagina - 1) * this.tamanoPagina;
    return this.territoriosFiltrados.slice(start, start + this.tamanoPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.territoriosFiltrados.length / this.tamanoPagina));
  }

  get rangoTerritorios(): string {
    if (!this.territoriosFiltrados.length) return '0 resultados';
    const start = (this.pagina - 1) * this.tamanoPagina + 1;
    const end = Math.min(this.pagina * this.tamanoPagina, this.territoriosFiltrados.length);
    return `${start}-${end} de ${this.territoriosFiltrados.length}`;
  }

  paginaAnterior(): void {
    if (this.pagina > 1) this.pagina--;
  }

  paginaSiguiente(): void {
    if (this.pagina < this.totalPaginas) this.pagina++;
  }

  get lastUpdatedText(): string {
    const value = this.data.summary.lastUpdated;
    return value
      ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Sin resultados cargados';
  }

  get consistencyMessage(): string {
    if (this.data.summary.consistent) {
      return 'Los votos de candidatos más el voto en blanco coinciden con el total de votos válidos.';
    }
    const difference = Math.abs(this.data.summary.consistencyDifference);
    return `Hay una diferencia de ${this.formatNumber(difference)} votos entre el consolidado válido y el detalle por candidatos.`;
  }

  candidateColor(candidate: PublicCandidate, index: number): string {
    return candidate.color || this.palette[index % this.palette.length];
  }

  formatType(value?: string): string {
    if (value === 'PRESIDENCIA') return 'Presidencia';
    if (value === 'SENADO') return 'Senado';
    if (value === 'CAMARA') return 'Cámara de Representantes';
    return value || 'Tipo no registrado';
  }

  formatRound(value?: string): string {
    if (value === 'PRIMERA') return 'Primera vuelta';
    if (value === 'SEGUNDA') return 'Segunda vuelta';
    if (value === 'NINGUNA') return 'Sin ronda';
    return value || 'Ronda no registrada';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value || 0);
  }

  private ajustarPagina(): void {
    if (this.pagina > this.totalPaginas) this.pagina = this.totalPaginas;
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private emptyData(): PublicDashboardData {
    return {
      elections: [],
      summary: {
        candidateVotes: 0,
        voters: 0,
        eligibleVoters: 0,
        validVotes: 0,
        blankVotes: 0,
        nullVotes: 0,
        unmarkedVotes: 0,
        reportedTables: 0,
        totalTables: 0,
        percentageTables: 0,
        participation: 0,
        departments: 0,
        municipalities: 0,
        resultRecords: 0,
        consistencyDifference: 0,
        consistent: true,
        source: 'SIN_DATOS',
      },
      candidates: [],
      territories: [],
    };
  }
}
