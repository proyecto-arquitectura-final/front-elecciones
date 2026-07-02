import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultadoService } from '../../../core/services/resultado.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { OfficialResult } from '../../../core/models/result.model';

@Component({
  selector: 'app-resultados-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resultados-analista.html',
  styleUrl: './resultados-analista.scss',
})
export class ResultadosAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  resultados: OfficialResult[] = [];
  filtroDepartamento = '';
  error = '';

  constructor(
    private readonly resultadoService: ResultadoService,
    private readonly reporteService: ReporteService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.resultadoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.resultados = [...data].sort(
            (a, b) =>
              this.time(b.importedAt || b.createdAt) - this.time(a.importedAt || a.createdAt),
          );
          this.error = '';
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudieron cargar los resultados.';
          console.error(error);
        },
      });
  }

  get departamentos(): string[] {
    return [...new Set(this.resultados.map((r) => r.department).filter(Boolean))].sort();
  }

  get resultadosFiltrados(): OfficialResult[] {
    return this.filtroDepartamento
      ? this.resultados.filter((r) => r.department === this.filtroDepartamento)
      : this.resultados;
  }

  get votosTotales(): number {
    return this.resultadosFiltrados.reduce((sum, r) => sum + (r.votes || 0), 0);
  }
  get mesasReportadas(): number {
    return this.territorios.reduce((sum, item) => sum + item.reported, 0);
  }
  get mesasTotales(): number {
    return this.territorios.reduce((sum, item) => sum + item.total, 0);
  }
  get pendientes(): number {
    return Math.max(0, this.mesasTotales - this.mesasReportadas);
  }
  get porcentajeMesas(): number {
    return this.mesasTotales
      ? Math.round((this.mesasReportadas * 1000) / this.mesasTotales) / 10
      : 0;
  }

  get stats() {
    return [
      {
        label: 'Mesas Reportadas',
        value: this.mesasReportadas,
        sub: `${this.porcentajeMesas}% del total`,
        pct: this.porcentajeMesas,
        icon: '✔',
        iconClass: 'icon-green',
        valueClass: '',
        fillClass: 'fill-green',
      },
      {
        label: 'Mesas Pendientes',
        value: this.pendientes,
        sub: 'Según total territorial',
        pct: this.mesasTotales ? (this.pendientes * 100) / this.mesasTotales : 0,
        icon: '⏳',
        iconClass: 'icon-orange',
        valueClass: 'orange',
        fillClass: 'fill-orange',
      },
      {
        label: 'Votos Consolidados',
        value: this.votosTotales,
        sub: 'Suma de resultados',
        pct: 100,
        icon: '🗳',
        iconClass: 'icon-blue',
        valueClass: '',
        fillClass: 'fill-blue',
      },
      {
        label: 'Registros',
        value: this.resultadosFiltrados.length,
        sub: 'Filas oficiales',
        pct: 100,
        icon: '📄',
        iconClass: 'icon-purple',
        valueClass: '',
        fillClass: 'fill-green',
      },
    ];
  }

  descargar(format: 'pdf' | 'csv' | 'json'): void {
    this.reporteService.descargarResultados(format);
  }

  private get territorios(): Array<{ reported: number; total: number }> {
    const map = new Map<string, { reported: number; total: number }>();
    for (const result of this.resultadosFiltrados) {
      const key = `${result.election?.id || result.electionId || 0}|${result.department}|${result.municipality}`;
      const current = map.get(key) || { reported: 0, total: 0 };
      current.reported = Math.max(current.reported, result.reportedTables || 0);
      current.total = Math.max(current.total, result.totalTables || 0);
      map.set(key, current);
    }
    return [...map.values()];
  }

  private time(value?: string): number {
    return value ? new Date(value).getTime() : 0;
  }
}
