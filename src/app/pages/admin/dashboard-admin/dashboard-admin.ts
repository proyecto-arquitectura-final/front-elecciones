import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval, retry, take, timeout } from 'rxjs';

import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import {
  AdminDashboardActivity,
  AdminDashboardData,
  AdminDashboardElection,
  AdminDashboardSystemStatus,
} from '../../../core/models/admin-dashboard.model';

interface DashboardStat {
  label: string;
  value: string;
  sub: string;
  icon: string;
  iconClass: string;
  route: string;
}

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnInit, OnDestroy {
  cargando = false;
  error = '';
  advertencia = '';
  ultimaActualizacion: Date | null = null;

  stats: DashboardStat[] = [];
  elecciones: AdminDashboardElection[] = [];
  actividad: AdminDashboardActivity[] = [];
  estadoSistema: AdminDashboardSystemStatus[] = [];

  private dashboard?: AdminDashboardData;
  private cargaActual?: Subscription;
  private actualizacionAutomatica?: Subscription;

  readonly accionesRapidas: QuickAction[] = [
    {
      icon: '👤',
      label: 'Nuevo candidato',
      description: 'Registrar una candidatura',
      route: '/admin/candidatos',
      queryParams: { action: 'new' },
    },
    {
      icon: '📈',
      label: 'Cargar encuesta',
      description: 'Agregar una nueva medición',
      route: '/admin/encuestas',
      queryParams: { action: 'new' },
    },
    {
      icon: '📄',
      label: 'Generar reporte',
      description: 'Exportar información consolidada',
      route: '/admin/reportes',
    },
    {
      icon: '🗳️',
      label: 'Gestionar resultados',
      description: 'Revisar y cargar resultados',
      route: '/admin/resultados',
    },
  ];

  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.actualizacionAutomatica = interval(60_000).subscribe(() => {
      if (!this.cargando && document.visibilityState === 'visible') {
        this.cargar(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.cargaActual?.unsubscribe();
    this.actualizacionAutomatica?.unsubscribe();
  }

  cargar(silenciosa = false): void {
    if (this.cargando) return;

    this.cargando = true;
    this.error = '';
    if (!silenciosa) this.advertencia = '';
    this.changeDetectorRef.markForCheck();

    this.cargaActual = this.dashboardService
      .obtener()
      .pipe(
        take(1),
        timeout({ first: 12_000 }),
        retry({ count: 1, delay: 500 }),
      )
      .subscribe({
        next: (data) => {
          this.aplicarDatos(data);
          this.cargando = false;
          this.advertencia = '';
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          this.cargando = false;
          const message = this.errorMessage(error);
          if (this.dashboard) {
            this.advertencia = `${message} Se conserva la última información disponible.`;
          } else {
            this.error = message;
          }
          console.error('No se pudo actualizar el panel administrativo:', error);
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  get tieneDatos(): boolean {
    return !!this.dashboard;
  }

  get sistemaDisponible(): boolean {
    return !!this.dashboard && !this.error;
  }

  tipoEleccion(type: string): string {
    const labels: Record<string, string> = {
      PRESIDENCIA: 'Presidencia',
      SENADO: 'Senado',
      CAMARA: 'Cámara',
    };
    return labels[type] || this.humanizar(type);
  }

  estadoEleccion(state: string): string {
    const labels: Record<string, string> = {
      CONFIGURADA: 'Configurada',
      ABIERTA: 'Abierta',
      EN_CONTEO: 'En conteo',
      CERRADA: 'Cerrada',
      ARCHIVADA: 'Archivada',
    };
    return labels[state] || this.humanizar(state);
  }

  estadoEleccionClass(state: string): string {
    if (state === 'ABIERTA') return 'state-open';
    if (state === 'EN_CONTEO') return 'state-counting';
    return 'state-neutral';
  }

  statusClass(status: AdminDashboardSystemStatus): string {
    return status.level === 'SUCCESS'
      ? 'status-success'
      : status.level === 'WARNING'
        ? 'status-warning'
        : 'status-error';
  }

  statusIcon(status: AdminDashboardSystemStatus): string {
    if (status.level === 'SUCCESS') return '✓';
    if (status.level === 'WARNING') return '!';
    return '×';
  }

  statusTitle(code: string): string {
    const labels: Record<string, string> = {
      SERVICES: 'Servicios de la aplicación',
      DATABASE: 'Base de datos',
      ELECTORAL_DATA: 'Información electoral',
    };
    return labels[code] || this.humanizar(code);
  }

  actividadIcon(activity: AdminDashboardActivity): string {
    if (!activity.success) return '!';
    const title = activity.title.toLowerCase();
    if (title.includes('elimin')) return '−';
    if (title.includes('actualiz')) return '↻';
    if (title.includes('import') || title.includes('cargad')) return '↑';
    return '✓';
  }


  formatDate(value: string): string {
    if (!value) return 'Sin fecha';
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  relativeTime(value: string): string {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return 'Sin fecha';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  trackByCode(_index: number, item: { code: string }): string {
    return item.code;
  }

  private aplicarDatos(data: AdminDashboardData): void {
    this.dashboard = data;
    const counters = data.counters;

    this.stats = [
      {
        label: 'Elecciones activas',
        value: String(counters.activeElections),
        sub: 'Abiertas o en conteo',
        icon: '🗳',
        iconClass: 'icon-blue',
        route: '/admin/elecciones',
      },
      {
        label: 'Candidatos registrados',
        value: String(counters.candidates),
        sub: `${counters.parties} partidos registrados`,
        icon: '👥',
        iconClass: 'icon-green',
        route: '/admin/candidatos',
      },
      {
        label: 'Encuestas cargadas',
        value: String(counters.polls),
        sub: 'Mediciones persistidas',
        icon: '📈',
        iconClass: 'icon-purple',
        route: '/admin/encuestas',
      },
      {
        label: 'Usuarios registrados',
        value: String(counters.users),
        sub: 'Administradores y analistas',
        icon: '👤',
        iconClass: 'icon-orange',
        route: '/admin/usuarios',
      },
    ];

    this.elecciones = [...(data.elections || [])];
    this.actividad = [...(data.recentActivity || [])];
    this.estadoSistema = [...(data.systemStatus || [])];
    this.ultimaActualizacion = data.generatedAt ? new Date(data.generatedAt) : new Date();
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const httpError = error as {
        error?: { message?: string } | string;
        message?: string;
        status?: number;
      };
      if (httpError.status === 0) return 'No se pudo conectar con el backend.';
      if (typeof httpError.error === 'object' && httpError.error?.message) {
        return httpError.error.message;
      }
      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }
      if (httpError.message) return httpError.message;
    }
    return 'No se pudo actualizar el panel administrativo.';
  }

  private humanizar(value: string): string {
    if (!value) return 'Sin información';
    const normalized = value.replaceAll('_', ' ').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
