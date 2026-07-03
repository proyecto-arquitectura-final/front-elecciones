import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../core/services/reporte.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { OfficialResult } from '../../../core/models/result.model';

interface RegionSummary {
  region: string;
  votos: number;
  participacion: number;
  mesas: number;
  totalMesas: number;
  procesado: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  resultados: OfficialResult[] = [];

  constructor(
    private readonly reporteService: ReporteService,
    private readonly resultadoService: ResultadoService,
  ) {}

  ngOnInit(): void {
    this.resultadoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe((data) => (this.resultados = data));
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
        label: 'Registros Incluidos',
        value: String(this.resultados.length),
        sub: 'Resultados oficiales',
        icon: '📄',
        iconClass: 'icon-blue',
      },
      {
        label: 'Votos Consolidados',
        value: this.votosTotales.toLocaleString('es-CO'),
        sub: 'Suma de registros',
        icon: '🗳',
        iconClass: 'icon-red',
      },
      {
        label: 'Regiones',
        value: String(this.regiones),
        sub: 'Departamentos con datos',
        icon: '📍',
        iconClass: 'icon-green',
      },
      {
        label: 'Mesas Reportadas',
        value: this.regionData.reduce((sum, item) => sum + item.mesas, 0).toLocaleString('es-CO'),
        sub: 'Según territorios consolidados',
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
      descripcion: 'Resultados completos por elección, candidato y territorio',
      formatos: ['PDF', 'CSV', 'JSON'],
      ultimoGenerado: 'Generación bajo demanda',
    },
  ];

  get regionData(): RegionSummary[] {
    const regions = new Map<
      string,
      {
        votos: number;
        participaciones: number[];
        territories: Map<string, { reported: number; total: number }>;
      }
    >();

    for (const result of this.resultados) {
      const region = result.department || 'Sin región';
      const item = regions.get(region) || {
        votos: 0,
        participaciones: [] as number[],
        territories: new Map<string, { reported: number; total: number }>(),
      };
      item.votos += result.votes || 0;
      if (result.participation !== undefined) item.participaciones.push(result.participation || 0);

      const electionId = result.election?.id || result.electionId || 0;
      const territoryKey = `${electionId}|${result.municipality || ''}`;
      const territory = item.territories.get(territoryKey) || { reported: 0, total: 0 };
      territory.reported = Math.max(territory.reported, result.reportedTables || 0);
      territory.total = Math.max(territory.total, result.totalTables || 0);
      item.territories.set(territoryKey, territory);
      regions.set(region, item);
    }

    return [...regions.entries()]
      .map(([region, item]) => {
        const tables = [...item.territories.values()].reduce(
          (sum, territory) => ({
            reported: sum.reported + territory.reported,
            total: sum.total + territory.total,
          }),
          { reported: 0, total: 0 },
        );
        return {
          region,
          votos: item.votos,
          participacion: item.participaciones.length
            ? Math.round(
                (item.participaciones.reduce((sum, value) => sum + value, 0) * 10) /
                  item.participaciones.length,
              ) / 10
            : 0,
          mesas: tables.reported,
          totalMesas: tables.total,
          procesado: tables.total ? Math.round((tables.reported * 1000) / tables.total) / 10 : 0,
        };
      })
      .sort((a, b) => b.votos - a.votos);
  }

  exportOpciones = [
    {
      icon: '📕',
      iconClass: 'icon-red',
      titulo: 'Exportar PDF',
      sub: 'Reporte formateado con tabla',
      btnLabel: 'Generar PDF',
      format: 'pdf' as const,
    },
    {
      icon: '📗',
      iconClass: 'icon-green',
      titulo: 'Exportar CSV',
      sub: 'Datos tabulados para Excel',
      btnLabel: 'Descargar CSV',
      format: 'csv' as const,
    },
    {
      icon: '📘',
      iconClass: 'icon-purple',
      titulo: 'Exportar JSON',
      sub: 'API e integración de datos',
      btnLabel: 'Obtener JSON',
      format: 'json' as const,
    },
  ];

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
