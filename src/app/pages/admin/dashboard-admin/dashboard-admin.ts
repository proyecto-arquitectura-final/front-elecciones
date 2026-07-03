import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  Observable,
  Subscription,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  retry,
  take,
  timeout,
} from 'rxjs';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Election } from '../../../core/models/election.model';
import { Candidate } from '../../../core/models/candidate.model';
import { Poll } from '../../../core/models/poll.model';
import { OfficialResult } from '../../../core/models/result.model';
import { AuditEvent } from '../../../core/models/audit.model';
import { AppUser } from '../../../core/models/user.model';

interface LoadResult<T> {
  value: T;
  ok: boolean;
  label: string;
  message?: string;
}

interface DashboardData {
  elecciones: LoadResult<Election[]>;
  candidatos: LoadResult<Candidate[]>;
  encuestas: LoadResult<Poll[]>;
  auditoria: LoadResult<AuditEvent[]>;
  resultados: LoadResult<OfficialResult[]>;
  usuarios: LoadResult<AppUser[]>;
  registraduria: LoadResult<string>;
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

  private cargaActual?: Subscription;

  private cache = {
    elecciones: [] as Election[],
    candidatos: [] as Candidate[],
    encuestas: [] as Poll[],
    auditoria: [] as AuditEvent[],
    resultados: [] as OfficialResult[],
    usuarios: [] as AppUser[],
    registraduria: 'NO_DISPONIBLE',
  };

  stats = [
    {
      label: 'Elecciones Activas',
      value: '0',
      sub: 'Abiertas o en conteo',
      icon: '🗳',
      iconClass: 'icon-blue',
    },
    {
      label: 'Candidatos Registrados',
      value: '0',
      sub: 'Todos los niveles',
      icon: '👥',
      iconClass: 'icon-green',
    },
    {
      label: 'Encuestas Cargadas',
      value: '0',
      sub: 'Registros persistidos',
      icon: '📈',
      iconClass: 'icon-purple',
    },
    {
      label: 'Usuarios Registrados',
      value: '0',
      sub: 'Administradores y analistas',
      icon: '👤',
      iconClass: 'icon-orange',
    },
  ];

  elecciones: Array<{
    id?: number;
    nombre: string;
    tipo: string;
    fecha: string;
    progreso: number;
    estado: string;
  }> = [];

  actividad: Array<{
    icon: string;
    colorClass: string;
    titulo: string;
    sub: string;
    tiempo: string;
  }> = [];

  apiEstado = [
    {
      titulo: 'API Registraduría',
      status: 'Consultando',
      sub: 'Esperando respuesta del backend',
      colorClass: 'api-blue',
      iconClass: 'icon-blue',
    },
    {
      titulo: 'Backend',
      status: 'Consultando',
      sub: 'Validando servicios REST',
      colorClass: 'api-blue',
      iconClass: 'icon-blue',
    },
    {
      titulo: 'Base de Datos',
      status: 'Consultando',
      sub: 'Validando consultas persistentes',
      colorClass: 'api-blue',
      iconClass: 'icon-blue',
    },
  ];

  accionesRapidas = [
    { icon: '👤', label: 'Nuevo Candidato', ruta: '/admin/candidatos' },
    { icon: '📈', label: 'Cargar Encuesta', ruta: '/admin/encuestas' },
    { icon: '📄', label: 'Generar Reporte', ruta: '/admin/reportes' },
    { icon: '🔄', label: 'Sincronizar Datos', ruta: '/admin/resultados' },
  ];

  constructor(
    private readonly eleccionService: EleccionService,
    private readonly candidatoService: CandidatoService,
    private readonly encuestaService: EncuestaService,
    private readonly auditoriaService: AuditoriaService,
    private readonly resultadoService: ResultadoService,
    private readonly usuarioService: UsuarioService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.cargaActual?.unsubscribe();
  }

  cargar(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.error = '';
    this.advertencia = '';
    this.marcarServiciosConsultando();
    this.changeDetectorRef.markForCheck();

    const requests = forkJoin({
      elecciones: this.safeRequest(
        this.eleccionService.listar(),
        this.cache.elecciones,
        'elecciones',
      ),
      candidatos: this.safeRequest(
        this.candidatoService.listar(),
        this.cache.candidatos,
        'candidatos',
      ),
      encuestas: this.safeRequest(this.encuestaService.listar(), this.cache.encuestas, 'encuestas'),
      auditoria: this.safeRequest(
        this.auditoriaService.listar(),
        this.cache.auditoria,
        'auditoría',
      ),
      resultados: this.safeRequest(
        this.resultadoService.listar(),
        this.cache.resultados,
        'resultados',
      ),
      usuarios: this.safeRequest(this.usuarioService.listar(), this.cache.usuarios, 'usuarios'),
      registraduria: this.safeRequest(
        this.resultadoService.estadoRegistraduria(),
        this.cache.registraduria,
        'API Registraduría',
      ),
    });

    this.cargaActual = requests
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          this.aplicarDatos(data);
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          // Es una protección adicional. Cada petición ya se recupera individualmente.
          this.error = this.errorMessage(error, 'No se pudo cargar el panel administrativo.');
          this.marcarServiciosNoDisponibles();
          console.error('Error inesperado al cargar el dashboard:', error);
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private aplicarDatos(data: DashboardData): void {
    this.actualizarCache(data);

    const activeElections = this.cache.elecciones.filter((election) =>
      ['ABIERTA', 'EN_CONTEO'].includes(election.state),
    );

    // Se reemplaza el arreglo completo para notificar correctamente los cambios
    // en Angular 21, donde la detección zoneless es el comportamiento predeterminado.
    this.stats = [
      { ...this.stats[0], value: String(activeElections.length) },
      { ...this.stats[1], value: String(this.cache.candidatos.length) },
      { ...this.stats[2], value: String(this.cache.encuestas.length) },
      { ...this.stats[3], value: String(this.cache.usuarios.length) },
    ];

    this.elecciones = [...activeElections]
      .sort((a, b) => this.dateValue(a.electionDate) - this.dateValue(b.electionDate))
      .map((election) => ({
        id: election.id,
        nombre: election.name,
        tipo: this.tipoEleccion(election),
        fecha: this.formatDate(election.electionDate),
        progreso: this.progresoEleccion(election.id, this.cache.resultados),
        estado: election.state,
      }));

    this.actividad = [...this.cache.auditoria]
      .sort((a, b) => this.dateValue(b.at) - this.dateValue(a.at))
      .slice(0, 6)
      .map((event) => this.toActivity(event));

    const failed = Object.values(data).filter((item) => !item.ok);
    const successful = Object.values(data).filter((item) => item.ok);

    if (failed.length > 0) {
      const names = failed.map((item) => item.label).join(', ');
      this.advertencia = `Se cargó la información disponible. No respondieron: ${names}.`;
    }

    if (successful.length === 0) {
      this.error = 'No fue posible consultar ningún servicio del backend.';
    }

    const backendOk = successful.some((item) => item.label !== 'API Registraduría');
    const databaseOk = [
      data.elecciones,
      data.candidatos,
      data.encuestas,
      data.resultados,
      data.usuarios,
    ].some((item) => item.ok);

    this.apiEstado = [
      {
        titulo: 'API Registraduría',
        status: data.registraduria.ok
          ? this.registraduriaStatus(this.cache.registraduria)
          : 'No disponible',
        sub: data.registraduria.ok
          ? 'Estado reportado por /registraduria/estado'
          : data.registraduria.message || 'No respondió dentro del tiempo esperado',
        colorClass: data.registraduria.ok ? 'api-green' : 'api-red',
        iconClass: data.registraduria.ok ? 'icon-green' : 'icon-red',
      },
      {
        titulo: 'Backend',
        status: backendOk ? 'Operativo' : 'No disponible',
        sub: backendOk
          ? `${successful.length} de ${Object.keys(data).length} consultas respondieron`
          : 'No se recibió respuesta de los servicios REST',
        colorClass: backendOk ? 'api-green' : 'api-red',
        iconClass: backendOk ? 'icon-green' : 'icon-red',
      },
      {
        titulo: 'Base de Datos',
        status: databaseOk ? 'Operativa' : 'Sin respuesta',
        sub: databaseOk
          ? `${this.totalRegistros()} registros consultados`
          : 'No fue posible consultar datos persistidos',
        colorClass: databaseOk ? 'api-green' : 'api-red',
        iconClass: databaseOk ? 'icon-green' : 'icon-red',
      },
    ];

    this.ultimaActualizacion = new Date();
  }

  private actualizarCache(data: DashboardData): void {
    if (data.elecciones.ok) this.cache.elecciones = data.elecciones.value;
    if (data.candidatos.ok) this.cache.candidatos = data.candidatos.value;
    if (data.encuestas.ok) this.cache.encuestas = data.encuestas.value;
    if (data.auditoria.ok) this.cache.auditoria = data.auditoria.value;
    if (data.resultados.ok) this.cache.resultados = data.resultados.value;
    if (data.usuarios.ok) this.cache.usuarios = data.usuarios.value;
    if (data.registraduria.ok) this.cache.registraduria = data.registraduria.value;
  }

  private safeRequest<T>(
    source: Observable<T>,
    fallback: T,
    label: string,
  ): Observable<LoadResult<T>> {
    return source.pipe(
      // HttpClient normalmente completa después de emitir. take(1) garantiza
      // que forkJoin no quede esperando si algún interceptor o wrapper conserva
      // el observable abierto después de entregar la respuesta.
      take(1),
      timeout({ first: 12000 }),
      retry({ count: 1, delay: 500 }),
      map((value) => ({
        value: value ?? fallback,
        ok: true,
        label,
      })),
      catchError((error) => {
        const message = this.errorMessage(error, `No se pudo consultar ${label}.`);
        console.warn(`Dashboard: falló la consulta de ${label}`, error);
        return of({ value: fallback, ok: false, label, message });
      }),
    );
  }

  private marcarServiciosConsultando(): void {
    this.apiEstado = this.apiEstado.map((item) => ({
      ...item,
      status: 'Consultando',
      sub: 'Actualizando información...',
      colorClass: 'api-blue',
      iconClass: 'icon-blue',
    }));
  }

  private marcarServiciosNoDisponibles(): void {
    this.apiEstado = this.apiEstado.map((item) => ({
      ...item,
      status: 'No disponible',
      sub: 'Revisa el backend y la sesión',
      colorClass: 'api-red',
      iconClass: 'icon-red',
    }));
  }

  private totalRegistros(): number {
    return (
      this.cache.elecciones.length +
      this.cache.candidatos.length +
      this.cache.encuestas.length +
      this.cache.resultados.length +
      this.cache.usuarios.length
    );
  }

  private registraduriaStatus(value: string): string {
    if (value === 'DATABASE_WITH_DATA') return 'Con datos';
    if (value === 'DATABASE_EMPTY') return 'Sin datos';
    if (value === 'NO_DISPONIBLE') return 'No disponible';
    return value || 'Conectada';
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      const httpError = error as {
        error?: { message?: string } | string;
        message?: string;
        status?: number;
      };

      if (typeof httpError.error === 'object' && httpError.error?.message) {
        return httpError.error.message;
      }
      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }
      if (httpError.status === 0) {
        return 'No se pudo conectar con el backend.';
      }
      if (httpError.message) {
        return httpError.message;
      }
    }
    return fallback;
  }

  private progresoEleccion(electionId: number | undefined, results: OfficialResult[]): number {
    if (!electionId) return 0;
    const electionResults = results.filter(
      (result) => result.election?.id === electionId || result.electionId === electionId,
    );
    const territories = new Map<string, { reported: number; total: number }>();

    for (const result of electionResults) {
      const key = `${result.department || ''}|${result.municipality || ''}`;
      const current = territories.get(key) || { reported: 0, total: 0 };
      current.reported = Math.max(current.reported, result.reportedTables || 0);
      current.total = Math.max(current.total, result.totalTables || 0);
      territories.set(key, current);
    }

    const totals = [...territories.values()].reduce(
      (acc, item) => ({ reported: acc.reported + item.reported, total: acc.total + item.total }),
      { reported: 0, total: 0 },
    );
    return totals.total ? Math.round((totals.reported * 1000) / totals.total) / 10 : 0;
  }

  private toActivity(event: AuditEvent) {
    const config: Record<string, { icon: string; colorClass: string; title: string }> = {
      CREATE: { icon: '✔', colorClass: 'act-green', title: 'Registro creado' },
      UPDATE: { icon: '✏', colorClass: 'act-blue', title: 'Registro actualizado' },
      DELETE: { icon: '🗑', colorClass: 'act-orange', title: 'Registro eliminado' },
      SYNC: { icon: '🔄', colorClass: 'act-blue', title: 'Sincronización ejecutada' },
      IMPORT: { icon: '⬆', colorClass: 'act-green', title: 'Importación ejecutada' },
    };
    const item = config[event.action] || {
      icon: '•',
      colorClass: 'act-blue',
      title: event.action || 'Actividad',
    };
    return {
      icon: item.icon,
      colorClass: item.colorClass,
      titulo: item.title,
      sub: `${event.entity || 'Sistema'}${event.entityId ? ` #${event.entityId}` : ''} · ${event.username || 'Sistema'}`,
      tiempo: this.relativeTime(event.at),
    };
  }

  private relativeTime(value: string): string {
    const diff = Date.now() - this.dateValue(value);
    const minutes = Math.max(0, Math.floor(diff / 60000));
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${Math.floor(hours / 24)} d`;
  }

  private tipoEleccion(election: Election): string {
    return election.type === 'CAMARA'
      ? 'Cámara'
      : election.type.charAt(0) + election.type.slice(1).toLowerCase();
  }

  private formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private dateValue(value?: string): number {
    return value ? new Date(value).getTime() : 0;
  }
}
