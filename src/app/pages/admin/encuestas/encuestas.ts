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
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, finalize, take, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EncuestaService } from '../../../core/services/encuesta.service';
import {
  Poll,
  PollCandidate,
  PollElection,
  PollManagementCounters,
  PollResult,
  PollStatus,
  PollUpsertRequest,
} from '../../../core/models/poll.model';
import { refreshView } from '../../../core/utils/zoneless-view.util';

interface PollResultForm {
  candidateId: number | null;
  percentage: number | null;
}

interface PollForm {
  id: number | null;
  electionId: number | null;
  source: string;
  date: string;
  sampleSize: number | null;
  marginError: number | null;
  methodology: string;
  status: PollStatus;
  results: PollResultForm[];
}

interface VoteBar {
  name: string;
  party: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-encuestas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuestas.html',
  styleUrl: './encuestas.scss',
})
export class Encuestas implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();
  private loadSubscription?: Subscription;
  private pendingQuickCreate = false;

  @ViewChild('firstField') firstField?: ElementRef<HTMLInputElement>;

  readonly statusOptions: ReadonlyArray<{ value: PollStatus; label: string }> = [
    { value: 'PENDIENTE', label: 'Pendiente de revisión' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' },
  ];

  loading = true;
  refreshing = false;
  saving = false;
  importing = false;
  deletingId: number | null = null;
  modalOpen = false;
  editMode = false;

  error = '';
  modalError = '';
  message = '';
  generatedAt: string | null = null;

  search = '';
  electionFilter: number | null = null;
  statusFilter: PollStatus | null = null;
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  counters: PollManagementCounters = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageSample: 0,
  };
  polls: Poll[] = [];
  elections: PollElection[] = [];
  candidates: PollCandidate[] = [];
  selectedPollId: number | null = null;
  form: PollForm = this.emptyForm();

  constructor(
    private readonly encuestaService: EncuestaService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      this.pendingQuickCreate = params.get('action') === 'new';
    });

    this.searchChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load(false);
      });

    timer(60_000, 60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.modalOpen && !this.saving && !this.importing && !this.refreshing) {
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
    if (!silent) {
      this.error = '';
    }

    this.loadSubscription = this.encuestaService
      .gestion({
        electionId: this.electionFilter,
        status: this.statusFilter,
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
          this.counters = data.counters;
          this.polls = data.polls.items ?? [];
          this.page = data.polls.page;
          this.pageSize = data.polls.size;
          this.totalElements = data.polls.totalElements;
          this.totalPages = data.polls.totalPages;
          this.elections = data.elections ?? [];
          this.candidates = data.candidates ?? [];
          this.generatedAt = data.generatedAt;
          this.error = '';
          this.syncSelectedPoll();

          if (this.pendingQuickCreate) {
            this.pendingQuickCreate = false;
            this.openModal();
          }
        },
        error: (response) => {
          this.error = hasPreviousData
            ? 'No fue posible actualizar. Se conservan los datos cargados anteriormente.'
            : this.errorMessage(response, 'No se pudieron cargar las encuestas.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchChanges.next(value.trim());
  }

  onFilterChange(): void {
    this.page = 0;
    this.load(false);
  }

  clearFilters(): void {
    this.search = '';
    this.electionFilter = null;
    this.statusFilter = null;
    this.page = 0;
    this.load(false);
  }

  selectPoll(poll: Poll): void {
    this.selectedPollId = poll.id;
  }

  get selectedPoll(): Poll | null {
    return this.polls.find((poll) => poll.id === this.selectedPollId) ?? this.polls[0] ?? null;
  }

  get approvedPercentage(): number {
    return this.counters.total > 0
      ? Math.round((this.counters.approved * 1000) / this.counters.total) / 10
      : 0;
  }

  get voteBars(): VoteBar[] {
    const results = this.selectedPoll?.results ?? [];
    return [...results]
      .sort((left, right) => right.percentage - left.percentage)
      .map((result, index) => ({
        name: result.candidate.name,
        party: result.candidate.party?.acronym || result.candidate.party?.name || 'Sin partido',
        percentage: Number(result.percentage || 0),
        color: result.candidate.party?.color || this.fallbackColor(index),
      }));
  }

  get details(): ReadonlyArray<{ label: string; value: string }> {
    const poll = this.selectedPoll;
    if (!poll) return [];
    return [
      { label: 'Elección', value: poll.election.name },
      { label: 'Fuente', value: poll.source },
      { label: 'Fecha de realización', value: poll.date },
      { label: 'Tamaño de muestra', value: `${poll.sampleSize.toLocaleString('es-CO')} personas` },
      { label: 'Margen de error', value: `±${poll.marginError}%` },
      { label: 'Metodología', value: poll.methodology },
      { label: 'Cobertura de resultados', value: `${poll.totalPercentage}%` },
    ];
  }

  get formCandidates(): PollCandidate[] {
    if (this.form.electionId == null) return [];
    const selectedIds = new Set(
      this.form.results
        .map((result) => result.candidateId)
        .filter((id): id is number => id != null),
    );
    return this.candidates.filter(
      (candidate) =>
        candidate.electionId === this.form.electionId && (candidate.active || selectedIds.has(candidate.id)),
    );
  }

  openModal(poll?: Poll): void {
    if (!poll && this.availableElections.length === 0) {
      this.error = 'No hay elecciones disponibles para registrar una encuesta.';
      return;
    }

    this.editMode = !!poll;
    this.modalError = '';
    this.message = '';
    this.form = poll
      ? {
          id: poll.id,
          electionId: poll.election.id,
          source: poll.source,
          date: poll.date,
          sampleSize: poll.sampleSize,
          marginError: poll.marginError,
          methodology: poll.methodology,
          status: poll.status,
          results: poll.results.length
            ? poll.results.map((result) => this.toResultForm(result))
            : [this.emptyResult()],
        }
      : {
          ...this.emptyForm(),
          electionId: this.defaultElectionId(),
        };
    this.modalOpen = true;
    this.focusFirstFieldWhenAppropriate();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onModalFieldFocus(event: FocusEvent): void {
    const field = event.target as HTMLElement | null;
    if (!field || !this.isCoarsePointer()) return;

    // Android WebView can leave focused fields hidden inside a nested scroll area
    // when the soft keyboard opens. Waiting for the viewport resize keeps the
    // active control visible without stealing focus from the user.
    globalThis.setTimeout(() => {
      field.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }, 220);
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.modalError = '';
    this.editMode = false;
    this.form = this.emptyForm();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen) this.closeModal();
  }

  onElectionChange(): void {
    this.form.results = [this.emptyResult()];
  }

  addResult(): void {
    this.form.results.push(this.emptyResult());
  }

  removeResult(index: number): void {
    if (this.form.results.length === 1) {
      this.form.results[0] = this.emptyResult();
      return;
    }
    this.form.results.splice(index, 1);
  }

  isCandidateDisabled(candidateId: number, rowIndex: number): boolean {
    return this.form.results.some(
      (result, index) => index !== rowIndex && result.candidateId === candidateId,
    );
  }

  get resultTotal(): number {
    return Math.round(
      this.form.results.reduce((sum, result) => sum + Number(result.percentage || 0), 0) * 100,
    ) / 100;
  }

  save(): void {
    this.modalError = '';
    const validation = this.validateForm();
    if (validation) {
      this.modalError = validation;
      return;
    }

    const request: PollUpsertRequest = {
      electionId: Number(this.form.electionId),
      source: this.form.source.trim(),
      date: this.form.date,
      sampleSize: Number(this.form.sampleSize),
      marginError: Number(this.form.marginError),
      methodology: this.form.methodology.trim(),
      status: this.form.status,
      results: this.form.results.map((result) => ({
        candidateId: Number(result.candidateId),
        percentage: Number(result.percentage),
      })),
    };

    const wasEditing = this.editMode;
    const operation = wasEditing && this.form.id != null
      ? this.encuestaService.actualizar(this.form.id, request)
      : this.encuestaService.crear(request);

    this.saving = true;
    operation
      .pipe(
        finalize(() => (this.saving = false)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: (saved) => {
          this.modalOpen = false;
          this.message = wasEditing
            ? 'Encuesta actualizada correctamente.'
            : 'Encuesta creada correctamente.';
          this.selectedPollId = saved.id;
          this.page = 0;
          this.load(false);
        },
        error: (response) => {
          this.modalError = this.errorMessage(response, 'No se pudo guardar la encuesta.');
        },
      });
  }

  deletePoll(poll: Poll): void {
    if (!confirm(`¿Eliminar la encuesta de “${poll.source}” del ${poll.date}?`)) return;

    this.error = '';
    this.message = '';
    this.deletingId = poll.id;
    this.encuestaService
      .eliminar(poll.id)
      .pipe(
        finalize(() => (this.deletingId = null)),
        refreshView(this.cdr),
      )
      .subscribe({
        next: () => {
          this.message = 'Encuesta eliminada correctamente.';
          if (this.polls.length === 1 && this.page > 0) this.page--;
          this.load(false);
        },
        error: (response) => {
          this.error = this.errorMessage(response, 'No se pudo eliminar la encuesta.');
        },
      });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

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
    this.encuestaService
      .importarCsv(file)
      .pipe(
        finalize(() => {
          this.importing = false;
          input.value = '';
        }),
        refreshView(this.cdr),
      )
      .subscribe({
        next: (result) => {
          this.message = `${result.polls} encuesta(s) y ${result.results} resultado(s) importados correctamente.`;
          this.page = 0;
          this.load(false);
        },
        error: (response) => {
          this.error = this.errorMessage(
            response,
            'No se pudo importar el CSV. Revisa las columnas y sus valores.',
          );
        },
      });
  }

  downloadCsvTemplate(): void {
    const headers = [
      'electionId',
      'source',
      'date',
      'sampleSize',
      'marginError',
      'methodology',
      'status',
      'candidateId',
      'percentage',
    ];
    const blob = new Blob([`${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'plantilla-encuestas.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  previousPage(): void {
    if (this.page === 0) return;
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

  statusLabel(status: PollStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  statusClass(status: PollStatus): string {
    return {
      APROBADA: 'badge-aprobado',
      PENDIENTE: 'badge-pendiente',
      RECHAZADA: 'badge-rechazado',
    }[status];
  }

  trackByPoll(_: number, poll: Poll): number {
    return poll.id;
  }

  trackByCandidate(_: number, candidate: PollCandidate): number {
    return candidate.id;
  }

  private focusFirstFieldWhenAppropriate(): void {
    // Programmatic focus is useful with mouse/keyboard, but on Android WebView it
    // may consume the user activation that is needed to open the soft keyboard.
    if (this.isCoarsePointer()) return;

    globalThis.setTimeout(() => {
      this.firstField?.nativeElement.focus({ preventScroll: true });
    });
  }

  private isCoarsePointer(): boolean {
    try {
      return globalThis.matchMedia?.('(hover: none), (pointer: coarse)').matches ?? false;
    } catch {
      return false;
    }
  }

  private validateForm(): string | null {
    const election = this.elections.find((item) => item.id === this.form.electionId);
    if (!election) return 'Selecciona una elección válida.';
    if (election.state === 'ARCHIVADA') return 'No se pueden modificar encuestas de una elección archivada.';

    const source = this.form.source.trim();
    if (!source) return 'La fuente de la encuesta es obligatoria.';
    if (source.length > 160) return 'La fuente no puede superar 160 caracteres.';
    if (!this.form.date) return 'La fecha de realización es obligatoria.';

    const today = new Date().toISOString().slice(0, 10);
    if (this.form.date > today) return 'La fecha de la encuesta no puede estar en el futuro.';
    if (election.date && this.form.date > election.date) {
      return 'La fecha de la encuesta no puede ser posterior a la elección.';
    }

    if (this.form.sampleSize == null || this.form.sampleSize < 1 || this.form.sampleSize > 10_000_000) {
      return 'El tamaño de muestra debe estar entre 1 y 10.000.000.';
    }
    if (this.form.marginError == null || this.form.marginError <= 0 || this.form.marginError > 20) {
      return 'El margen de error debe ser mayor que 0 y no superar 20%.';
    }

    const methodology = this.form.methodology.trim();
    if (!methodology) return 'La metodología es obligatoria.';
    if (methodology.length > 500) return 'La metodología no puede superar 500 caracteres.';

    if (!this.form.results.length || this.form.results.some((result) => result.candidateId == null)) {
      return 'Selecciona un candidato en cada resultado.';
    }
    const ids = this.form.results.map((result) => Number(result.candidateId));
    if (new Set(ids).size !== ids.length) return 'No puedes registrar el mismo candidato más de una vez.';
    if (
      this.form.results.some(
        (result) =>
          result.percentage == null || result.percentage < 0 || result.percentage > 100,
      )
    ) {
      return 'Cada porcentaje debe estar entre 0 y 100.';
    }
    if (this.resultTotal > 100.01) {
      return `La suma de porcentajes no puede superar 100%. Total actual: ${this.resultTotal}%.`;
    }
    if (this.form.status === 'APROBADA' && this.resultTotal <= 0) {
      return 'Una encuesta aprobada debe tener resultados mayores que cero.';
    }
    return null;
  }

  private syncSelectedPoll(): void {
    if (this.selectedPollId != null && this.polls.some((poll) => poll.id === this.selectedPollId)) {
      return;
    }
    this.selectedPollId = this.polls[0]?.id ?? null;
  }

  private get availableElections(): PollElection[] {
    return this.elections.filter((election) => election.state !== 'ARCHIVADA');
  }

  private defaultElectionId(): number | null {
    if (
      this.electionFilter != null &&
      this.availableElections.some((election) => election.id === this.electionFilter)
    ) {
      return this.electionFilter;
    }
    return this.availableElections[0]?.id ?? null;
  }

  private toResultForm(result: PollResult): PollResultForm {
    return {
      candidateId: result.candidate?.id ?? result.candidateId ?? null,
      percentage: Number(result.percentage ?? 0),
    };
  }

  private emptyResult(): PollResultForm {
    return { candidateId: null, percentage: null };
  }

  private emptyForm(): PollForm {
    return {
      id: null,
      electionId: null,
      source: '',
      date: '',
      sampleSize: null,
      marginError: null,
      methodology: '',
      status: 'PENDIENTE',
      results: [this.emptyResult()],
    };
  }

  private fallbackColor(index: number): string {
    const palette = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];
    return palette[index % palette.length];
  }

  private errorMessage(response: unknown, fallback: string): string {
    const error = response as { error?: { message?: string } };
    return error?.error?.message?.trim() || fallback;
  }
}
