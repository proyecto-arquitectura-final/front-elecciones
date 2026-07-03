import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ReportFormat, ReportManagement, ReportRegion } from '../../../core/models/report.model';
import { ReporteService } from '../../../core/services/reporte.service';
import { refreshView } from '../../../core/utils/zoneless-view.util';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private autoRefresh?: Subscription;

  management?: ReportManagement;
  selectedElectionId: number | null = null;
  loading = false;
  refreshing = false;
  downloading?: ReportFormat;
  error = '';
  downloadMessage = '';

  constructor(private readonly reporteService: ReporteService) {}

  ngOnInit(): void {
    this.load(false);
    this.autoRefresh = interval(60_000).subscribe(() => this.load(true));
  }

  ngOnDestroy(): void {
    this.autoRefresh?.unsubscribe();
  }

  get regions(): ReportRegion[] {
    return this.management?.regions ?? [];
  }

  get maxVotes(): number {
    return Math.max(0, ...this.regions.map((region) => region.votes));
  }

  get stats() {
    const counters = this.management?.counters;
    return [
      { label: 'Registros validados', value: counters?.records ?? 0, sub: 'Incluidos en el reporte', icon: '📄', class: 'blue' },
      { label: 'Votos consolidados', value: counters?.votes ?? 0, sub: 'Suma de resultados validados', icon: '🗳', class: 'red' },
      { label: 'Regiones', value: counters?.regions ?? 0, sub: 'Departamentos con información', icon: '📍', class: 'green' },
      { label: 'Mesas reportadas', value: counters?.reportedTables ?? 0, sub: `${counters?.processedPercentage ?? 0}% procesado`, icon: '▦', class: 'purple' },
    ];
  }

  load(background = false): void {
    if (this.loading || this.refreshing) return;
    this.error = '';
    if (background && this.management) this.refreshing = true;
    else this.loading = true;

    this.reporteService
      .gestion(this.selectedElectionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.management = data;
          this.selectedElectionId = data.selectedElectionId ?? null;
          this.loading = false;
          this.refreshing = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No fue posible actualizar el reporte.';
          this.loading = false;
          this.refreshing = false;
        },
      });
  }

  changeElection(): void {
    this.downloadMessage = '';
    this.load(false);
  }

  barHeight(region: ReportRegion): number {
    if (!this.maxVotes) return 0;
    return Math.max(4, Math.round((region.votes * 100) / this.maxVotes));
  }

  lastGenerated(format: ReportFormat): string {
    const generation = this.management?.lastGenerated?.[format];
    return generation
      ? `${new Date(generation.generatedAt).toLocaleString('es-CO')} · ${generation.requestedBy}`
      : 'Aún no generado';
  }

  download(format: ReportFormat): void {
    if (!this.selectedElectionId || this.downloading) return;
    this.error = '';
    this.downloadMessage = '';
    this.downloading = format;
    this.reporteService
      .descargarResultadosPorEleccion(this.selectedElectionId, format)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            this.error = 'El archivo generado no contiene datos.';
            this.downloading = undefined;
            return;
          }
          const contentDisposition = response.headers.get('content-disposition') ?? '';
          const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
          const filename = match?.[1] ?? `resultados.${format.toLowerCase()}`;
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(url);
          this.downloadMessage = `Reporte ${format} generado correctamente.`;
          this.downloading = undefined;
          this.load(true);
        },
        error: (err) => {
          this.downloading = undefined;
          this.error = err?.error?.message || 'No fue posible generar el archivo solicitado.';
        },
      });
  }

  trackByRegion(_: number, region: ReportRegion): string {
    return region.region;
  }
}
