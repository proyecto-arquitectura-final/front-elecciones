import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AuditEvent, AuditManagement } from '../../../core/models/audit.model';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { refreshView } from '../../../core/utils/zoneless-view.util';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss',
})
export class Auditoria implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private autoRefresh?: Subscription;

  management?: AuditManagement;
  search = '';
  action = '';
  entity = '';
  status = '';
  page = 0;
  readonly size = 20;
  loading = false;
  refreshing = false;
  error = '';

  constructor(private readonly auditoriaService: AuditoriaService) {}

  ngOnInit(): void {
    this.load(false);
    this.autoRefresh = interval(60_000).subscribe(() => this.load(true));
  }

  ngOnDestroy(): void {
    this.autoRefresh?.unsubscribe();
  }

  get events(): AuditEvent[] {
    return this.management?.events.items ?? [];
  }

  get totalPages(): number {
    return this.management?.events.totalPages ?? 0;
  }

  get stats() {
    const counters = this.management?.counters;
    const total = counters?.total ?? 0;
    const success = counters?.successful ?? 0;
    return [
      {
        label: 'Total de eventos',
        value: total,
        sub: 'Registros persistidos',
        icon: '🗃',
        iconClass: 'icon-blue',
        valueClass: '',
      },
      {
        label: 'Operaciones exitosas',
        value: success,
        sub: total ? `${Math.round((success * 100) / total)}% de éxito` : 'Sin registros',
        icon: '✓',
        iconClass: 'icon-green',
        valueClass: '',
      },
      {
        label: 'Operaciones fallidas',
        value: counters?.failed ?? 0,
        sub: 'Requieren seguimiento',
        icon: '!',
        iconClass: 'icon-red',
        valueClass: 'red',
      },
      {
        label: 'Usuarios con actividad',
        value: counters?.users ?? 0,
        sub: 'Identidades registradas',
        icon: '👤',
        iconClass: 'icon-purple',
        valueClass: '',
      },
    ];
  }

  load(background = false): void {
    if (this.loading || this.refreshing) return;
    this.error = '';
    if (background && this.management) this.refreshing = true;
    else this.loading = true;

    this.auditoriaService
      .gestion({
        search: this.search,
        action: this.action,
        entity: this.entity,
        success: this.status === '' ? null : this.status === 'true',
        page: this.page,
        size: this.size,
      })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.management = data;
          this.page = data.events.page;
          this.loading = false;
          this.refreshing = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No fue posible actualizar el registro de auditoría.';
          this.loading = false;
          this.refreshing = false;
        },
      });
  }

  applyFilters(): void {
    this.page = 0;
    this.load(false);
  }

  clearFilters(): void {
    this.search = '';
    this.action = '';
    this.entity = '';
    this.status = '';
    this.page = 0;
    this.load(false);
  }

  changePage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages || nextPage === this.page) return;
    this.page = nextPage;
    this.load(false);
  }

  actionClass(action: string): string {
    const normalized = action.toUpperCase();
    if (normalized.includes('DELETE') || normalized.includes('FAIL')) return 'action-danger';
    if (normalized.includes('CREATE') || normalized.includes('IMPORT')) return 'action-create';
    if (normalized.includes('UPDATE') || normalized.includes('VALIDATE')) return 'action-update';
    return 'action-neutral';
  }

  trackById(_: number, event: AuditEvent): number {
    return event.id;
  }
}
