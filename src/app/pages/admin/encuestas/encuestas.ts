import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { Poll, PollResult } from '../../../core/models/poll.model';
import { Candidate } from '../../../core/models/candidate.model';

interface PollResultForm {
  candidateId: number | null;
  percentage: number;
}

interface PollForm {
  id: number | null;
  fuente: string;
  fecha: string;
  muestra: number | null;
  margen: number | null;
  metodologia: string;
  resultados: PollResultForm[];
}

@Component({
  selector: 'app-encuestas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuestas.html',
  styleUrl: './encuestas.scss',
})
export class Encuestas implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  busqueda = '';
  modalAbierto = false;
  modoEdicion = false;
  importando = false;
  error = '';
  mensaje = '';
  form: PollForm = this.formVacio();
  encuestas: Poll[] = [];
  candidatos: Candidate[] = [];

  constructor(
    private readonly encuestaService: EncuestaService,
    private readonly candidatoService: CandidatoService,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCandidatos();
  }

  cargar(): void {
    this.encuestaService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.encuestas = [...data].sort((a, b) => this.time(b.date) - this.time(a.date));
          this.error = '';
        },
        error: (error) => {
          this.error = 'No se pudieron cargar las encuestas.';
          console.error(error);
        },
      });
  }

  cargarCandidatos(): void {
    this.candidatoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => (this.candidatos = data.filter((candidate) => candidate.active)),
        error: (error) => console.error(error),
      });
  }

  get encuestasFiltradas(): Poll[] {
    const search = this.busqueda.trim().toLowerCase();
    return this.encuestas.filter((poll) => !search || poll.source.toLowerCase().includes(search));
  }

  get aprobadas(): number {
    return this.encuestas.filter((poll) => this.esValida(poll)).length;
  }

  get pendientes(): number {
    return this.encuestas.length - this.aprobadas;
  }

  get pctAprobadas(): number {
    return this.encuestas.length
      ? Math.round((this.aprobadas * 1000) / this.encuestas.length) / 10
      : 0;
  }

  get muestraPromedio(): number {
    return this.encuestas.length
      ? Math.round(
          this.encuestas.reduce((sum, poll) => sum + (poll.sampleSize || 0), 0) /
            this.encuestas.length,
        )
      : 0;
  }

  get intencionVoto() {
    const latest = this.encuestas[0];
    return (latest?.results || []).map((result, index) => ({
      nombre: result.candidate?.name || `Candidato ${index + 1}`,
      pct: result.percentage || 0,
      color: result.candidate?.party?.color || this.fallbackColor(index),
    }));
  }

  get detallesMetod() {
    const poll = this.encuestas[0];
    return poll
      ? [
          { label: 'Fuente', value: poll.source },
          { label: 'Fecha de Realización', value: poll.date },
          { label: 'Tamaño de Muestra', value: `${poll.sampleSize} personas` },
          { label: 'Margen de Error', value: `±${poll.marginError}%` },
          { label: 'Metodología', value: poll.methodology },
          { label: 'Resultados', value: `${poll.results.length} candidatos` },
        ]
      : [];
  }

  abrirModal(poll?: Poll): void {
    this.modoEdicion = !!poll;
    this.error = '';
    this.mensaje = '';
    this.form = poll
      ? {
          id: poll.id || null,
          fuente: poll.source,
          fecha: poll.date,
          muestra: poll.sampleSize,
          margen: poll.marginError,
          metodologia: poll.methodology,
          resultados: poll.results.length
            ? poll.results.map((result) => this.toResultForm(result))
            : [this.resultadoVacio()],
        }
      : this.formVacio();
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.error = '';
    this.form = this.formVacio();
  }

  agregarResultado(): void {
    this.form.resultados.push(this.resultadoVacio());
  }

  eliminarResultado(index: number): void {
    this.form.resultados.splice(index, 1);
    if (!this.form.resultados.length) this.agregarResultado();
  }

  guardar(): void {
    this.error = '';

    if (
      !this.form.fuente.trim() ||
      !this.form.fecha ||
      !this.form.muestra ||
      this.form.muestra <= 0
    ) {
      this.error = 'Completa fuente, fecha y un tamaño de muestra válido.';
      return;
    }

    const selected = this.form.resultados.filter((result) => result.candidateId !== null);
    const candidateIds = selected.map((result) => Number(result.candidateId));

    if (new Set(candidateIds).size !== candidateIds.length) {
      this.error = 'No puedes registrar el mismo candidato más de una vez.';
      return;
    }

    if (selected.some((result) => result.percentage < 0 || result.percentage > 100)) {
      this.error = 'Cada porcentaje debe estar entre 0 y 100.';
      return;
    }

    const total = selected.reduce((sum, result) => sum + Number(result.percentage || 0), 0);
    if (total > 100.01) {
      this.error = `La suma de porcentajes no puede superar 100%. Total actual: ${total.toFixed(1)}%.`;
      return;
    }

    const request: Poll = {
      source: this.form.fuente.trim(),
      date: this.form.fecha,
      sampleSize: Number(this.form.muestra),
      marginError: Number(this.form.margen || 0),
      methodology: this.form.metodologia,
      results: selected.map((result) => ({
        candidateId: Number(result.candidateId),
        percentage: Number(result.percentage || 0),
      })),
    };

    const operation =
      this.modoEdicion && this.form.id
        ? this.encuestaService.actualizar(this.form.id, request)
        : this.encuestaService.crear(request);

    operation.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.cerrarModal();
        this.mensaje = this.modoEdicion
          ? 'Encuesta actualizada correctamente.'
          : 'Encuesta creada correctamente.';
        this.cargar();
      },
      error: (error) => {
        this.error = error?.error?.message || 'No se pudo guardar la encuesta.';
        console.error(error);
      },
    });
  }

  eliminar(poll: Poll): void {
    if (!poll.id || !confirm(`¿Eliminar encuesta de "${poll.source}"?`)) return;

    this.encuestaService
      .eliminar(poll.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => {
          this.mensaje = 'Encuesta eliminada correctamente.';
          this.cargar();
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudo eliminar la encuesta.';
          console.error(error);
        },
      });
  }

  importarCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importando = true;
    this.error = '';
    this.mensaje = '';

    this.encuestaService
      .importarCsv(file)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (count) => {
          this.importando = false;
          this.mensaje = `${count} encuesta(s) importada(s) correctamente.`;
          input.value = '';
          this.cargar();
        },
        error: (error) => {
          this.importando = false;
          this.error =
            error?.error?.message ||
            'No se pudo importar el CSV. Verifica las columnas requeridas.';
          input.value = '';
          console.error(error);
        },
      });
  }

  private esValida(poll: Poll): boolean {
    if (!this.encuestas.length) return false;
    const averageSample = this.encuestas.reduce((sum, item) => sum + (item.sampleSize || 0), 0) / this.encuestas.length;
    const averageMargin = this.encuestas.reduce((sum, item) => sum + (item.marginError || 0), 0) / this.encuestas.length;
    return (poll.sampleSize || 0) >= averageSample && (poll.marginError || 0) <= averageMargin;
  }

  private toResultForm(result: PollResult): PollResultForm {
    return {
      candidateId: result.candidate?.id ?? result.candidateId ?? null,
      percentage: Number(result.percentage || 0),
    };
  }

  private resultadoVacio(): PollResultForm {
    return { candidateId: null, percentage: 0 };
  }

  private formVacio(): PollForm {
    return {
      id: null,
      fuente: '',
      fecha: '',
      muestra: null,
      margen: null,
      metodologia: '',
      resultados: [this.resultadoVacio()],
    };
  }

  private fallbackColor(index: number): string {
    const palette = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];
    return palette[index % palette.length];
  }

  private time(value?: string): number {
    return value ? new Date(`${value}T00:00:00`).getTime() : 0;
  }
}
