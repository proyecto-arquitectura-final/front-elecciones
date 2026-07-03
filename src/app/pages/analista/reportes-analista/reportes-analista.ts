import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { ResultadoService } from '../../../core/services/resultado.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { OfficialResult } from '../../../core/models/result.model';

@Component({
  selector: 'app-reportes-analista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-analista.html',
  styleUrl: './reportes-analista.scss',
})
export class ReportesAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  resultados: OfficialResult[] = [];
  error = '';

  constructor(
    private readonly resultadoService: ResultadoService,
    private readonly reporteService: ReporteService,
  ) {}

  ngOnInit(): void {
    this.resultadoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => (this.resultados = data),
        error: (error) => {
          this.error = error?.error?.message || 'No se pudo preparar la vista previa de reportes.';
          console.error(error);
        },
      });
  }

  get votosTotales(): number {
    return this.resultados.reduce((sum, result) => sum + (result.votes || 0), 0);
  }
  get regiones(): number {
    return new Set(this.resultados.map((result) => result.department || 'Sin región')).size;
  }

  get stats() {
    return [
      {
        label: 'Registros disponibles',
        value: String(this.resultados.length),
        sub: 'Resultados oficiales',
        icon: '📄',
        iconClass: 'icon-blue',
      },
      {
        label: 'Votos consolidados',
        value: this.votosTotales.toLocaleString('es-CO'),
        sub: 'Incluidos en reportes',
        icon: '🗳',
        iconClass: 'icon-red',
      },
      {
        label: 'Regiones',
        value: String(this.regiones),
        sub: 'Departamentos reportados',
        icon: '📍',
        iconClass: 'icon-green',
      },
      {
        label: 'Fuentes',
        value: String(new Set(this.resultados.map((item) => item.source || 'Sin fuente')).size),
        sub: 'Orígenes de datos',
        icon: '📘',
        iconClass: 'icon-purple',
      },
    ];
  }

  reportes = [
    {
      icon: '🗳',
      iconClass: 'icon-blue',
      titulo: 'Reporte de Resultados Consolidados',
      descripcion: 'Resultados por elección, candidato y territorio',
      formatos: ['PDF', 'CSV', 'JSON'],
      ultimoGenerado: 'Generación bajo demanda',
    },
  ];

  get regionData() {
    const map = new Map<string, { votos: number; participaciones: number[] }>();
    for (const result of this.resultados) {
      const region = result.department || 'Sin región';
      const current = map.get(region) || { votos: 0, participaciones: [] };
      current.votos += result.votes || 0;
      current.participaciones.push(result.participation || 0);
      map.set(region, current);
    }
    return [...map.entries()]
      .map(([region, data]) => ({
        region,
        votos: data.votos,
        participacion: data.participaciones.length
          ? Math.round(
              (data.participaciones.reduce((sum, value) => sum + value, 0) * 10) /
                data.participaciones.length,
            ) / 10
          : 0,
      }))
      .sort((a, b) => b.votos - a.votos);
  }

  get maxRegionVotes(): number {
    return Math.max(0, ...this.regionData.map((item) => item.votos));
  }

  get chartAxis(): number[] {
    if (!this.maxRegionVotes) return [0];
    const top = Math.ceil(this.maxRegionVotes / 1000) * 1000 || this.maxRegionVotes;
    return [top, top * 0.75, top * 0.5, top * 0.25, 0].map((value) => Math.round(value));
  }

  descargar(format: 'pdf' | 'csv' | 'json'): void {
    this.reporteService.descargarResultados(format);
  }
}
