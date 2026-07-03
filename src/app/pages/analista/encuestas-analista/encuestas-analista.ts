import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { Poll } from '../../../core/models/poll.model';

@Component({
  selector: 'app-encuestas-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuestas-analista.html',
  styleUrl: './encuestas-analista.scss',
})
export class EncuestasAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  busqueda = '';
  encuestas: Poll[] = [];
  error = '';

  constructor(private readonly encuestaService: EncuestaService) {}

  ngOnInit(): void {
    this.cargar();
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
          this.error = error?.error?.message || 'No se pudieron cargar las encuestas.';
          console.error(error);
        },
      });
  }

  get encuestasFiltradas(): Poll[] {
    const search = this.busqueda.trim().toLowerCase();
    return this.encuestas.filter((poll) => !search || poll.source.toLowerCase().includes(search));
  }

  get aprobadas(): number {
    return this.encuestas.filter((poll) => poll.status === 'APROBADA').length;
  }
  get pendientes(): number {
    return this.encuestas.filter((poll) => poll.status === 'PENDIENTE').length;
  }
  get rechazadas(): number {
    return this.encuestas.filter((poll) => poll.status === 'RECHAZADA').length;
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

  get encuestaPublicada(): Poll | null {
    return this.encuestas.find((poll) => poll.status === 'APROBADA') ?? null;
  }

  get intencionVoto() {
    return (this.encuestaPublicada?.results || []).map((result, index) => ({
      nombre: result.candidate?.name || `Candidato ${index + 1}`,
      pct: result.percentage || 0,
      color: result.candidate?.party?.color || this.fallbackColor(index),
    }));
  }

  get detallesMetod() {
    const poll = this.encuestaPublicada;
    return poll
      ? [
          { label: 'Fuente', value: poll.source },
          { label: 'Fecha de Realización', value: poll.date },
          { label: 'Tamaño de Muestra', value: `${poll.sampleSize} personas` },
          { label: 'Margen de Error', value: `±${poll.marginError}%` },
          { label: 'Metodología', value: poll.methodology },
          { label: 'Candidatos medidos', value: String(poll.results.length) },
        ]
      : [];
  }

  estado(poll: Poll): string {
    return { APROBADA: 'Aprobada', PENDIENTE: 'En revisión', RECHAZADA: 'Rechazada' }[poll.status];
  }

  exportarCsv(): void {
    const header = ['id', 'source', 'date', 'sampleSize', 'marginError', 'methodology'];
    const rows = this.encuestas.map((poll) => [
      poll.id,
      poll.source,
      poll.date,
      poll.sampleSize,
      poll.marginError,
      poll.methodology,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'encuestas.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private fallbackColor(index: number): string {
    const palette = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];
    return palette[index % palette.length];
  }

  private time(value?: string): number {
    return value ? new Date(`${value}T00:00:00`).getTime() : 0;
  }
}
