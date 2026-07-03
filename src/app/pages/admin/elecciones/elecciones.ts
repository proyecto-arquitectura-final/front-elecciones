import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, interval, take, takeUntil } from 'rxjs';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { EleccionService } from '../../../core/services/eleccion.service';
import {
  Election,
  ElectionManagement,
  ElectionManagementItem,
  ElectionRound,
  ElectionState,
  ElectionType,
} from '../../../core/models/election.model';

interface ElectionForm {
  id: number | null;
  name: string;
  type: ElectionType;
  round: ElectionRound;
  electionDate: string;
  state: ElectionState;
}

interface FieldErrors {
  name?: string;
  type?: string;
  round?: string;
  electionDate?: string;
  state?: string;
}

const EMPTY_MANAGEMENT: ElectionManagement = {
  counters: {
    total: 0,
    configured: 0,
    open: 0,
    counting: 0,
    closed: 0,
    archived: 0,
    withSummary: 0,
    withoutSummary: 0,
  },
  elections: [],
  generatedAt: '',
};

@Component({
  selector: 'app-elecciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elecciones.html',
  styleUrl: './elecciones.scss',
})
export class Elecciones implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  management: ElectionManagement = EMPTY_MANAGEMENT;
  search = '';
  typeFilter: ElectionType | 'ALL' = 'ALL';
  stateFilter: ElectionState | 'ALL' = 'ALL';
  summaryFilter: 'ALL' | 'WITH' | 'WITHOUT' = 'ALL';
  page = 1;
  pageSize = 8;

  loading = true;
  refreshing = false;
  saving = false;
  deleting = false;
  error = '';
  success = '';

  editorOpen = false;
  deleteOpen = false;
  editMode = false;
  electionToDelete: ElectionManagementItem | null = null;
  selectedElection: ElectionManagementItem | null = null;
  fieldErrors: FieldErrors = {};
  form: ElectionForm = this.emptyForm();

  constructor(
    private readonly eleccionService: EleccionService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.load(true);
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      if (params.get('action') === 'new') this.openEditor();
    });

    interval(60_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.load(false, true));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.deleteOpen) {
      this.closeDelete();
    } else if (this.editorOpen) {
      this.closeEditor();
    }
  }

  load(initial = false, silent = false): void {
    if (initial && this.management.elections.length === 0) {
      this.loading = true;
    } else if (!silent) {
      this.refreshing = true;
    }
    if (!silent) this.error = '';

    this.eleccionService
      .gestion()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.management = data;
          this.loading = false;
          this.refreshing = false;
          this.normalizePage();
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.refreshing = false;
          if (!silent) {
            this.error = this.readError(
              error,
              'No se pudo cargar la gestión de elecciones. Intenta nuevamente.',
            );
          }
        },
      });
  }

  get elections(): ElectionManagementItem[] {
    return this.management.elections;
  }

  get activeCount(): number {
    return this.management.counters.open + this.management.counters.counting;
  }

  get completedCount(): number {
    return this.management.counters.closed + this.management.counters.archived;
  }

  get filteredElections(): ElectionManagementItem[] {
    const term = this.search.trim().toLowerCase();
    return this.elections.filter((election) => {
      const matchesSearch =
        !term ||
        [
          election.name,
          this.typeLabel(election.type),
          this.roundLabel(election.round),
          this.stateLabel(election.state),
          election.electionDate,
        ].some((value) => value.toLowerCase().includes(term));
      const matchesType = this.typeFilter === 'ALL' || election.type === this.typeFilter;
      const matchesState = this.stateFilter === 'ALL' || election.state === this.stateFilter;
      const matchesSummary =
        this.summaryFilter === 'ALL' ||
        (this.summaryFilter === 'WITH'
          ? election.summaryAvailable
          : !election.summaryAvailable);

      return matchesSearch && matchesType && matchesState && matchesSummary;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredElections.length / this.pageSize));
  }

  get pagedElections(): ElectionManagementItem[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredElections.slice(start, start + this.pageSize);
  }

  get visibleFrom(): number {
    return this.filteredElections.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get visibleTo(): number {
    return Math.min(this.page * this.pageSize, this.filteredElections.length);
  }

  get stateOptions(): ElectionState[] {
    if (!this.editMode || !this.selectedElection) return ['CONFIGURADA'];
    return [
      this.selectedElection.state,
      ...this.selectedElection.allowedStates.filter(
        (state) => state !== this.selectedElection?.state,
      ),
    ];
  }

  get structuralFieldsDisabled(): boolean {
    return Boolean(this.editMode && this.selectedElection?.structureLocked);
  }

  filtersChanged(): void {
    this.page = 1;
  }

  clearFilters(): void {
    this.search = '';
    this.typeFilter = 'ALL';
    this.stateFilter = 'ALL';
    this.summaryFilter = 'ALL';
    this.page = 1;
  }

  filterByState(state: ElectionState | 'ALL'): void {
    this.stateFilter = state;
    this.page = 1;
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  openEditor(election?: ElectionManagementItem): void {
    this.error = '';
    this.success = '';
    this.fieldErrors = {};
    this.editMode = Boolean(election);
    this.selectedElection = election ?? null;
    this.form = election
      ? {
          id: election.id,
          name: election.name,
          type: election.type,
          round: election.round,
          electionDate: election.electionDate,
          state: election.state,
        }
      : this.emptyForm();
    this.editorOpen = true;
  }

  closeEditor(): void {
    if (this.saving) return;
    this.editorOpen = false;
    this.editMode = false;
    this.selectedElection = null;
    this.fieldErrors = {};
    this.form = this.emptyForm();
  }

  typeChanged(): void {
    this.fieldErrors.type = undefined;
    this.fieldErrors.round = undefined;
    this.form.round = this.form.type === 'PRESIDENCIA' ? 'PRIMERA' : 'NINGUNA';
  }

  save(): void {
    this.error = '';
    this.success = '';
    this.fieldErrors = this.validateForm();
    if (Object.keys(this.fieldErrors).length > 0) return;

    const request: Election = {
      name: this.form.name.trim().replace(/\s+/g, ' '),
      type: this.form.type,
      round: this.form.round,
      electionDate: this.form.electionDate,
      state: this.form.state,
    };

    this.saving = true;
    const operation =
      this.editMode && this.form.id
        ? this.eleccionService.actualizar(this.form.id, request)
        : this.eleccionService.crear(request);

    operation.pipe(refreshView(this.cdr)).subscribe({
      next: (saved) => {
        this.saving = false;
        this.editorOpen = false;
        this.selectedElection = null;
        this.form = this.emptyForm();
        this.success = this.editMode
          ? `${saved.name} fue actualizada correctamente.`
          : `${saved.name} fue creada correctamente.`;
        this.load(false);
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.error = this.readError(error, 'No se pudo guardar la elección.');
      },
    });
  }

  requestDelete(election: ElectionManagementItem): void {
    this.error = '';
    this.success = '';
    if (!election.deletable) {
      this.error = this.deleteRestrictionMessage(election);
      return;
    }
    this.electionToDelete = election;
    this.deleteOpen = true;
  }

  closeDelete(): void {
    if (this.deleting) return;
    this.deleteOpen = false;
    this.electionToDelete = null;
  }

  confirmDelete(): void {
    const election = this.electionToDelete;
    if (!election) return;

    this.deleting = true;
    this.eleccionService
      .eliminar(election.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.deleteOpen = false;
          this.electionToDelete = null;
          this.success = `${election.name} fue eliminada correctamente.`;
          this.load(false);
        },
        error: (error: HttpErrorResponse) => {
          this.deleting = false;
          this.deleteOpen = false;
          this.electionToDelete = null;
          this.error = this.readError(error, 'No se pudo eliminar la elección.');
        },
      });
  }

  typeLabel(type: ElectionType): string {
    return type === 'PRESIDENCIA' ? 'Presidencia' : type === 'SENADO' ? 'Senado' : 'Cámara';
  }

  roundLabel(round: ElectionRound): string {
    if (round === 'PRIMERA') return 'Primera vuelta';
    if (round === 'SEGUNDA') return 'Segunda vuelta';
    return 'No aplica';
  }

  stateLabel(state: ElectionState): string {
    return {
      CONFIGURADA: 'Configurada',
      ABIERTA: 'Abierta',
      EN_CONTEO: 'En conteo',
      CERRADA: 'Cerrada',
      ARCHIVADA: 'Archivada',
    }[state];
  }

  stateDescription(state: ElectionState): string {
    return {
      CONFIGURADA: 'Lista para preparación',
      ABIERTA: 'Proceso electoral abierto',
      EN_CONTEO: 'Resultados en actualización',
      CERRADA: 'Proceso finalizado',
      ARCHIVADA: 'Conservada para consulta',
    }[state];
  }

  typeClass(type: ElectionType): string {
    return `type-${type.toLowerCase()}`;
  }

  stateClass(state: ElectionState): string {
    return `state-${state.toLowerCase().replace('_', '-')}`;
  }

  formatDate(value?: string | null): string {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  formatDateTime(value?: string | null): string {
    if (!value) return 'Sin actualización registrada';
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  progressLabel(election: ElectionManagementItem): string {
    if (!election.summaryAvailable || election.progress === null) return 'Sin resumen';
    return `${election.progress.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
  }

  private validateForm(): FieldErrors {
    const errors: FieldErrors = {};
    const name = this.form.name.trim();
    if (!name) errors.name = 'El nombre es obligatorio.';
    else if (name.length < 5) errors.name = 'Usa un nombre más descriptivo.';
    else if (name.length > 180) errors.name = 'El nombre no puede superar 180 caracteres.';

    if (!this.form.type) errors.type = 'Selecciona el tipo de elección.';
    if (!this.form.electionDate) errors.electionDate = 'Selecciona la fecha de la elección.';
    if (this.form.type === 'PRESIDENCIA' && this.form.round === 'NINGUNA') {
      errors.round = 'Presidencia requiere primera o segunda vuelta.';
    }
    if (this.form.type !== 'PRESIDENCIA' && this.form.round !== 'NINGUNA') {
      errors.round = 'Senado y Cámara no utilizan ronda presidencial.';
    }
    if (!this.stateOptions.includes(this.form.state)) {
      errors.state = 'El cambio de estado seleccionado no está permitido.';
    }
    return errors;
  }

  private deleteRestrictionMessage(election: ElectionManagementItem): string {
    if (!['CONFIGURADA', 'ARCHIVADA'].includes(election.state)) {
      return `${election.name} no puede eliminarse en estado ${this.stateLabel(election.state).toLowerCase()}.`;
    }
    return `${election.name} tiene candidatos, resultados, resumen electoral o conversaciones asociadas. Archívala para conservar la trazabilidad.`;
  }

  private normalizePage(): void {
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    const message = error?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }

  private emptyForm(): ElectionForm {
    return {
      id: null,
      name: '',
      type: 'PRESIDENCIA',
      round: 'PRIMERA',
      electionDate: '',
      state: 'CONFIGURADA',
    };
  }
}
