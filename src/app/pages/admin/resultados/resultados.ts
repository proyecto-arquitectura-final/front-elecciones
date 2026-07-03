import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  finalize,
  timer,
} from 'rxjs';
import { ResultadoService } from '../../../core/services/resultado.service';
import {
  OfficialResult,
  OfficialResultRequest,
  ResultCandidate,
  ResultElection,
  ResultManagementCounters,
  ResultSummary,
  ResultSummaryRequest,
  ResultStatusOption,
  ResultValidationStatus,
} from '../../../core/models/result.model';
import { refreshView } from '../../../core/utils/zoneless-view.util';

interface ResultForm {
  id: number | null;
  electionId: number | null;
  candidateId: number | null;
  department: string;
  municipality: string;
  votes: number | null;
  reportedTables: number | null;
  totalTables: number | null;
  participation: number | null;
  source: string;
}

interface SummaryForm {
  electionId: number | null;
  eligibleVoters: number | null;
  totalVoters: number | null;
  validVotes: number | null;
  blankVotes: number | null;
  nullVotes: number | null;
  unmarkedVotes: number | null;
  reportedTables: number | null;
  totalTables: number | null;
  source: string;
  importedAt: string;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss',
})
export class Resultados implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();
  private loadSubscription?: Subscription;

  @ViewChild('firstField') firstField?: ElementRef<HTMLSelectElement>;
  @ViewChild('summaryFirstField') summaryFirstField?: ElementRef<HTMLInputElement>;

  statusOptions: ResultStatusOption[] = [];

  loading = true;
  refreshing = false;
  saving = false;
  savingSummary = false;
  importing = false;
  validating = false;
  deletingId: number | null = null;
  modalOpen = false;
  summaryModalOpen = false;
  editMode = false;

  error = '';
  message = '';
  modalError = '';
  summaryError = '';
  generatedAt: string | null = null;

  search = '';
  electionFilter: number | null = null;
  statusFilter: ResultValidationStatus | null = null;
  departmentFilter = '';
  municipalityFilter = '';
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  counters: ResultManagementCounters = this.emptyCounters();
  summary: ResultSummary | null = null;
  results: OfficialResult[] = [];
  elections: ResultElection[] = [];
  candidates: ResultCandidate[] = [];
  departments: string[] = [];
  municipalities: string[] = [];

  form: ResultForm = this.emptyForm();
  summaryForm: SummaryForm = this.emptySummaryForm();

  constructor(private readonly resultadoService: ResultadoService) {}

  ngOnInit(): void {
    this.searchChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load(false);
      });

    timer(60_000, 60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (
          !this.modalOpen &&
          !this.summaryModalOpen &&
          !this.saving &&
          !this.savingSummary &&
          !this.importing &&
          !this.validating &&
          !this.refreshing
        ) {
          this.load(false, true);
        }
      });

    this.load(true);
  }

  load(initial = false, silent = false): void {
    this.loadSubscription?.unsubscribe();
    const hasPreviousData = this.generatedAt !== null;
    this.loading = initial && !hasPreviousData;
    this.refreshing = hasPreviousData && !silent;
    if (!silent) this.error = '';

    this.loadSubscription = this.resultadoService
      .gestion({
        electionId: this.electionFilter,
        status: this.statusFilter,
        department: this.departmentFilter,
        municipality: this.municipalityFilter,
        search: this.search,
        page: this.page,
        size: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
        }),
        refreshView(this.cdr),
      )
      .subscribe({
        next: (data) => {
          this.electionFilter = data.selectedElectionId ?? null;
          this.counters = data.counters;
          this.summary = data.summary ?? null;
          this.results = data.results.items ?? [];
          this.page = data.results.page;
          this.pageSize = data.results.size;
          this.totalElements = data.results.totalElements;
          this.totalPages = data.results.totalPages;
          this.elections = data.elections ?? [];
          this.candidates = data.candidates ?? [];
          this.statusOptions = data.validationStatuses ?? [];
          this.departments = data.departments ?? [];
          this.municipalities = data.municipalities ?? [];
          this.generatedAt = data.generatedAt;
          this.error = '';
        },
        error: (response) => {
          this.error = hasPreviousData
            ? 'No fue posible actualizar. Se conservan los datos cargados anteriormente.'
            : this.errorMessage(response, 'No se pudieron cargar los resultados oficiales.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchChanges.next(value.trim());
  }

  onElectionChange(): void {
    this.page = 0;
    this.departmentFilter = '';
    this.municipalityFilter = '';
    this.load(false);
  }

  onDepartmentChange(): void {
    this.page = 0;
    this.municipalityFilter = '';
    this.load(false);
  }

  onFilterChange(): void {
    this.page = 0;
    this.load(false);
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = null;
    this.departmentFilter = '';
    this.municipalityFilter = '';
    this.page = 0;
    this.load(false);
  }

  openModal(result?: OfficialResult): void {
    if (!this.electionFilter) {
      this.error = 'Selecciona una elección antes de registrar resultados.';
      return;
    }
    if (!this.canManageSelectedElection) {
      this.error = 'Los resultados de una elección archivada son de solo lectura.';
      return;
    }
    if (!result && !this.candidates.some((candidate) => candidate.active)) {
      this.error = 'La elección seleccionada no tiene candidatos activos disponibles.';
      return;
    }

    this.editMode = !!result;
    this.modalError = '';
    this.message = '';
    this.form = result
      ? {
          id: result.id,
          electionId: result.election.id,
          candidateId: result.candidate.id,
          department: result.department ?? '',
          municipality: result.municipality ?? '',
          votes: result.votes,
          reportedTables: result.reportedTables,
          totalTables: result.totalTables,
          participation: result.participation,
          source: result.source,
        }
      : {
          ...this.emptyForm(),
          electionId: this.electionFilter,
        };
    this.modalOpen = true;
    queueMicrotask(() => this.firstField?.nativeElement.focus());
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.modalError = '';
    this.editMode = false;
    this.form = this.emptyForm();
  }

  save(): void {
    this.modalError = '';
    const validation = this.validateResultForm();
    if (validation) {
      this.modalError = validation;
      return;
    }

    const request: OfficialResultRequest = {
      electionId: Number(this.form.electionId),
      candidateId: Number(this.form.candidateId),
      department: this.normalizeOptional(this.form.department),
      municipality: this.normalizeOptional(this.form.municipality),
      votes: Number(this.form.votes),
      reportedTables: Number(this.form.reportedTables),
      totalTables: Number(this.form.totalTables),
      participation: Number(this.form.participation),
      source: this.normalizeOptional(this.form.source),
    };

    const editing = this.editMode && this.form.id != null;
    const operation = editing
      ? this.resultadoService.actualizar(this.form.id!, request)
      : this.resultadoService.crear(request);

    this.saving = true;
    operation
      .pipe(
        finalize(() => (this.saving = false)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: () => {
          this.modalOpen = false;
          this.message = editing
            ? 'Resultado actualizado correctamente.'
            : 'Resultado registrado correctamente.';
          this.page = 0;
          this.load(false);
        },
        error: (response) => {
          this.modalError = this.errorMessage(response, 'No se pudo guardar el resultado.');
        },
      });
  }

  deleteResult(result: OfficialResult): void {
    if (!this.canManageSelectedElection) {
      this.error = 'Los resultados de una elección archivada son de solo lectura.';
      return;
    }
    const territory = [result.department, result.municipality].filter(Boolean).join(' / ') || 'Nacional';
    if (!confirm(`¿Eliminar el resultado de “${result.candidate.name}” para ${territory}?`)) return;

    this.deletingId = result.id;
    this.error = '';
    this.message = '';
    this.resultadoService
      .eliminar(result.id)
      .pipe(
        finalize(() => (this.deletingId = null)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: () => {
          this.message = 'Resultado eliminado correctamente.';
          if (this.results.length === 1 && this.page > 0) this.page--;
          this.load(false);
        },
        error: (response) => {
          this.error = this.errorMessage(response, 'No se pudo eliminar el resultado.');
        },
      });
  }

  openSummaryModal(): void {
    if (!this.electionFilter) {
      this.error = 'Selecciona una elección antes de editar el consolidado.';
      return;
    }
    if (!this.canManageSelectedElection) {
      this.error = 'El consolidado de una elección archivada es de solo lectura.';
      return;
    }
    const summary = this.summary;
    this.summaryError = '';
    this.message = '';
    this.summaryForm = summary
      ? {
          electionId: summary.electionId,
          eligibleVoters: summary.eligibleVoters,
          totalVoters: summary.totalVoters,
          validVotes: summary.validVotes,
          blankVotes: summary.blankVotes,
          nullVotes: summary.nullVotes,
          unmarkedVotes: summary.unmarkedVotes,
          reportedTables: summary.reportedTables,
          totalTables: summary.totalTables,
          source: summary.source,
          importedAt: this.toLocalDateTime(summary.importedAt),
        }
      : {
          ...this.emptySummaryForm(),
          electionId: this.electionFilter,
        };
    this.summaryModalOpen = true;
    queueMicrotask(() => this.summaryFirstField?.nativeElement.focus());
  }

  closeSummaryModal(): void {
    if (this.savingSummary) return;
    this.summaryModalOpen = false;
    this.summaryError = '';
    this.summaryForm = this.emptySummaryForm();
  }

  saveSummary(): void {
    this.summaryError = '';
    const validation = this.validateSummaryForm();
    if (validation) {
      this.summaryError = validation;
      return;
    }

    const request: ResultSummaryRequest = {
      electionId: Number(this.summaryForm.electionId),
      eligibleVoters: Number(this.summaryForm.eligibleVoters),
      totalVoters: Number(this.summaryForm.totalVoters),
      validVotes: Number(this.summaryForm.validVotes),
      blankVotes: Number(this.summaryForm.blankVotes),
      nullVotes: Number(this.summaryForm.nullVotes),
      unmarkedVotes: Number(this.summaryForm.unmarkedVotes),
      reportedTables: Number(this.summaryForm.reportedTables),
      totalTables: Number(this.summaryForm.totalTables),
      source: this.normalizeOptional(this.summaryForm.source),
      importedAt: this.summaryForm.importedAt
        ? new Date(this.summaryForm.importedAt).toISOString()
        : null,
    };

    this.savingSummary = true;
    this.resultadoService
      .guardarResumen(request)
      .pipe(
        finalize(() => (this.savingSummary = false)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: () => {
          this.summaryModalOpen = false;
          this.message = 'Consolidado electoral guardado correctamente.';
          this.load(false);
        },
        error: (response) => {
          this.summaryError = this.errorMessage(response, 'No se pudo guardar el consolidado.');
        },
      });
  }

  validateResults(): void {
    if (!this.electionFilter || !this.canManageSelectedElection || this.validating) return;
    this.validating = true;
    this.error = '';
    this.message = '';
    this.resultadoService
      .validar(this.electionFilter)
      .pipe(
        finalize(() => (this.validating = false)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: (response) => {
          this.message = response.rejected
            ? `Validación finalizada: ${response.validated} válidos y ${response.rejected} rechazados.`
            : `Validación finalizada: ${response.validated} resultados válidos.`;
          this.load(false);
        },
        error: (response) => {
          this.error = this.errorMessage(response, 'No se pudo ejecutar la validación.');
        },
      });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.canManageSelectedElection) {
      this.error = 'Los resultados de una elección archivada son de solo lectura.';
      input.value = '';
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error = 'Selecciona un archivo con extensión .csv.';
      input.value = '';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      this.error = 'El CSV debe contener información y no superar 5 MB.';
      input.value = '';
      return;
    }

    this.importing = true;
    this.error = '';
    this.message = '';
    this.resultadoService
      .importarCsv(file)
      .pipe(
        finalize(() => {
          this.importing = false;
          input.value = '';
        }),
        refreshView(this.cdr),
      )
      .subscribe({
        next: (response) => {
          this.message = `Importación completada: ${response.created} creados y ${response.updated} actualizados.`;
          this.page = 0;
          this.load(false);
        },
        error: (response) => {
          this.error = this.errorMessage(response, 'No se pudo importar el archivo CSV.');
        },
      });
  }

  downloadCsvTemplate(): void {
    const headers = [
      'electionId',
      'candidateId',
      'department',
      'municipality',
      'votes',
      'reportedTables',
      'totalTables',
      'participation',
      'source',
    ];
    const blob = new Blob([`${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-resultados-oficiales.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  previousPage(): void {
    if (this.page <= 0) return;
    this.page--;
    this.load(false);
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.load(false);
  }

  changePageSize(): void {
    this.page = 0;
    this.load(false);
  }

  statusLabel(status: ResultValidationStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  statusClass(status: ResultValidationStatus): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  traceabilityLabel(): string {
    const labels: Record<ResultManagementCounters['traceabilityStatus'], string> = {
      SIN_DATOS: 'Sin datos',
      INCOMPLETA: 'Incompleta',
      REQUIERE_REVISION: 'Requiere revisión',
      COMPLETA: 'Completa',
    };
    return labels[this.counters.traceabilityStatus];
  }

  traceabilityClass(): string {
    return `traceability-${this.counters.traceabilityStatus.toLowerCase()}`;
  }

  reconciliationText(): string {
    if (!this.summary) return 'Registra el consolidado para comparar votos.';
    if (this.counters.reconciled) return 'Los votos por candidato coinciden con el consolidado.';
    const difference = this.counters.reconciliationDifference;
    return difference > 0
      ? `Hay ${Math.abs(difference).toLocaleString('es-CO')} votos de más frente al consolidado.`
      : `Faltan ${Math.abs(difference).toLocaleString('es-CO')} votos frente al consolidado.`;
  }

  trackByResult(_: number, result: OfficialResult): number {
    return result.id;
  }

  get selectedElection(): ResultElection | null {
    return this.elections.find((election) => election.id === this.electionFilter) ?? null;
  }

  get canManageSelectedElection(): boolean {
    return this.selectedElection != null && this.selectedElection.state !== 'ARCHIVADA';
  }

  get formCandidates(): ResultCandidate[] {
    const selectedCandidateId = this.form.candidateId;
    return this.candidates.filter(
      (candidate) => candidate.active || candidate.id === selectedCandidateId,
    );
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen) this.closeModal();
    else if (this.summaryModalOpen) this.closeSummaryModal();
  }

  private validateResultForm(): string | null {
    if (!this.form.electionId || !this.form.candidateId) {
      return 'Selecciona una elección y un candidato.';
    }
    if (!this.isNonNegative(this.form.votes)) return 'Los votos deben ser un número no negativo.';
    if (!this.isNonNegative(this.form.reportedTables) || !this.isNonNegative(this.form.totalTables)) {
      return 'Las mesas deben ser números no negativos.';
    }
    if (Number(this.form.reportedTables) > Number(this.form.totalTables)) {
      return 'Las mesas reportadas no pueden superar las mesas totales.';
    }
    if (
      this.form.participation == null ||
      Number(this.form.participation) < 0 ||
      Number(this.form.participation) > 100
    ) {
      return 'La participación debe estar entre 0 y 100.';
    }
    if (this.normalizeOptional(this.form.municipality) && !this.normalizeOptional(this.form.department)) {
      return 'Selecciona el departamento del municipio.';
    }
    return null;
  }

  private validateSummaryForm(): string | null {
    if (!this.summaryForm.electionId) return 'La elección es obligatoria.';
    const values = [
      this.summaryForm.eligibleVoters,
      this.summaryForm.totalVoters,
      this.summaryForm.validVotes,
      this.summaryForm.blankVotes,
      this.summaryForm.nullVotes,
      this.summaryForm.unmarkedVotes,
      this.summaryForm.reportedTables,
      this.summaryForm.totalTables,
    ];
    if (values.some((value) => !this.isNonNegative(value))) {
      return 'Todos los valores del consolidado deben ser no negativos.';
    }
    if (Number(this.summaryForm.reportedTables) > Number(this.summaryForm.totalTables)) {
      return 'Las mesas reportadas no pueden superar las mesas totales.';
    }
    if (
      Number(this.summaryForm.eligibleVoters) > 0 &&
      Number(this.summaryForm.totalVoters) > Number(this.summaryForm.eligibleVoters)
    ) {
      return 'Los sufragantes no pueden superar el potencial electoral.';
    }
    if (Number(this.summaryForm.blankVotes) > Number(this.summaryForm.validVotes)) {
      return 'Los votos en blanco no pueden superar los votos válidos.';
    }
    const breakdown =
      Number(this.summaryForm.validVotes) +
      Number(this.summaryForm.nullVotes) +
      Number(this.summaryForm.unmarkedVotes);
    if (Number(this.summaryForm.totalVoters) > 0 && breakdown > Number(this.summaryForm.totalVoters)) {
      return 'El desglose de votos supera el total de sufragantes.';
    }
    return null;
  }

  private isNonNegative(value: number | null): boolean {
    return value != null && Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  private normalizeOptional(value: string): string | null {
    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized || null;
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private errorMessage(response: any, fallback: string): string {
    return response?.error?.message || response?.message || fallback;
  }

  private emptyCounters(): ResultManagementCounters {
    return {
      records: 0,
      candidateVotes: 0,
      reportedTables: 0,
      totalTables: 0,
      tablePercentage: 0,
      participation: 0,
      validated: 0,
      pending: 0,
      rejected: 0,
      traceabilityStatus: 'SIN_DATOS',
      reconciliationDifference: 0,
      reconciled: false,
      lastImportedAt: null,
    };
  }

  private emptyForm(): ResultForm {
    return {
      id: null,
      electionId: null,
      candidateId: null,
      department: '',
      municipality: '',
      votes: 0,
      reportedTables: 0,
      totalTables: 0,
      participation: 0,
      source: '',
    };
  }

  private emptySummaryForm(): SummaryForm {
    return {
      electionId: null,
      eligibleVoters: 0,
      totalVoters: 0,
      validVotes: 0,
      blankVotes: 0,
      nullVotes: 0,
      unmarkedVotes: 0,
      reportedTables: 0,
      totalTables: 0,
      source: '',
      importedAt: '',
    };
  }
}
