import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CandidatoService } from '../../../core/services/candidato.service';
import {
  Candidate,
  CandidateElection,
  CandidateManagement,
  CandidateParty,
  CandidateUpsertRequest,
} from '../../../core/models/candidate.model';
import { ElectionType } from '../../../core/models/election.model';

interface CandidateForm {
  id: number | null;
  name: string;
  partyId: number | null;
  electionId: number | null;
  vicePresidentName: string;
  department: string;
  municipality: string;
  active: boolean;
}

interface FieldErrors {
  name?: string;
  partyId?: string;
  electionId?: string;
  vicePresidentName?: string;
  department?: string;
}

const EMPTY_MANAGEMENT: CandidateManagement = {
  counters: {
    total: 0,
    active: 0,
    inactive: 0,
    presidency: 0,
    senate: 0,
    chamber: 0,
    representedParties: 0,
  },
  candidates: [],
  parties: [],
  elections: [],
  generatedAt: '',
};

@Component({
  selector: 'app-candidatos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatos.html',
  styleUrl: './candidatos.scss',
})
export class Candidatos implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  management: CandidateManagement = EMPTY_MANAGEMENT;
  search = '';
  electionFilter = 'ALL';
  typeFilter: ElectionType | 'ALL' = 'ALL';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  page = 1;
  pageSize = 10;

  loading = true;
  refreshing = false;
  saving = false;
  deleting = false;
  error = '';
  success = '';

  editorOpen = false;
  deleteOpen = false;
  editMode = false;
  candidateToDelete: Candidate | null = null;
  fieldErrors: FieldErrors = {};
  form: CandidateForm = this.emptyForm();

  constructor(
    private readonly candidatoService: CandidatoService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.load(true);
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      if (params.get('action') === 'new') {
        this.openEditor();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.deleteOpen) {
      this.closeDelete();
    } else if (this.editorOpen) {
      this.closeEditor();
    }
  }

  load(initial = false): void {
    if (initial) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.error = '';

    this.candidatoService
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
          this.error = this.readError(
            error,
            'No se pudo cargar la gestión de candidatos. Intenta nuevamente.',
          );
        },
      });
  }

  get candidates(): Candidate[] {
    return this.management.candidates;
  }

  get parties(): CandidateParty[] {
    return this.management.parties;
  }

  get elections(): CandidateElection[] {
    return this.management.elections;
  }

  get availableParties(): CandidateParty[] {
    const selectedId = this.form.partyId;
    return this.parties.filter((party) => party.active || party.id === selectedId);
  }

  get availableElections(): CandidateElection[] {
    const selectedId = this.form.electionId;
    return this.elections.filter(
      (election) => election.state !== 'ARCHIVADA' || election.id === selectedId,
    );
  }

  get selectedElection(): CandidateElection | undefined {
    return this.elections.find((election) => election.id === Number(this.form.electionId));
  }

  get filteredCandidates(): Candidate[] {
    const term = this.search.trim().toLowerCase();
    return this.candidates.filter((candidate) => {
      const matchesSearch =
        !term ||
        [
          candidate.name,
          candidate.vicePresidentName,
          candidate.party?.name,
          candidate.party?.acronym,
          candidate.election?.name,
          candidate.department,
          candidate.municipality,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesElection =
        this.electionFilter === 'ALL' ||
        candidate.election?.id === Number(this.electionFilter);
      const matchesType =
        this.typeFilter === 'ALL' || candidate.electionType === this.typeFilter;
      const matchesStatus =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' ? candidate.active : !candidate.active);

      return matchesSearch && matchesElection && matchesType && matchesStatus;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCandidates.length / this.pageSize));
  }

  get pagedCandidates(): Candidate[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredCandidates.slice(start, start + this.pageSize);
  }

  get visibleFrom(): number {
    return this.filteredCandidates.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get visibleTo(): number {
    return Math.min(this.page * this.pageSize, this.filteredCandidates.length);
  }

  filtersChanged(): void {
    this.page = 1;
  }

  clearFilters(): void {
    this.search = '';
    this.electionFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.page = 1;
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  openEditor(candidate?: Candidate): void {
    this.error = '';
    this.success = '';
    this.fieldErrors = {};
    this.editMode = Boolean(candidate);
    this.form = candidate
      ? {
          id: candidate.id ?? null,
          name: candidate.name,
          partyId: candidate.party?.id ?? candidate.partyId ?? null,
          electionId: candidate.election?.id ?? candidate.electionId ?? null,
          vicePresidentName: candidate.vicePresidentName ?? '',
          department: candidate.department ?? '',
          municipality: candidate.municipality ?? '',
          active: candidate.active,
        }
      : this.emptyForm();
    this.editorOpen = true;
  }

  closeEditor(): void {
    if (this.saving) return;
    this.editorOpen = false;
    this.fieldErrors = {};
    this.form = this.emptyForm();
  }

  electionChanged(): void {
    this.fieldErrors.electionId = undefined;
    if (this.selectedElection?.type === 'PRESIDENCIA') {
      this.form.department = '';
      this.form.municipality = '';
    } else {
      this.form.vicePresidentName = '';
      if (this.selectedElection?.type === 'SENADO') {
        this.form.department = '';
        this.form.municipality = '';
      }
    }
  }

  save(): void {
    this.error = '';
    this.success = '';
    this.fieldErrors = this.validateForm();
    if (Object.keys(this.fieldErrors).length > 0) return;

    const election = this.selectedElection;
    if (!election || !this.form.partyId || !this.form.electionId) return;

    const request: CandidateUpsertRequest = {
      name: this.form.name.trim(),
      partyId: Number(this.form.partyId),
      electionId: Number(this.form.electionId),
      electionType: election.type,
      vicePresidentName:
        election.type === 'PRESIDENCIA'
          ? this.form.vicePresidentName.trim()
          : null,
      department:
        election.type === 'CAMARA' ? this.form.department.trim() : null,
      municipality:
        election.type === 'CAMARA'
          ? this.form.municipality.trim() || null
          : null,
      active: this.form.active,
    };

    this.saving = true;
    const operation =
      this.editMode && this.form.id
        ? this.candidatoService.actualizar(this.form.id, request)
        : this.candidatoService.crear(request);

    operation.pipe(refreshView(this.cdr)).subscribe({
      next: (candidate) => {
        this.saving = false;
        this.editorOpen = false;
        this.form = this.emptyForm();
        this.success = this.editMode
          ? `${candidate.name} fue actualizado correctamente.`
          : `${candidate.name} fue registrado correctamente.`;
        this.load(false);
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.error = this.readError(error, 'No se pudo guardar el candidato.');
      },
    });
  }

  requestDelete(candidate: Candidate): void {
    this.error = '';
    this.success = '';
    if (!candidate.deletable) {
      this.error = `${candidate.name} tiene resultados o encuestas asociados. Puedes editarlo y marcarlo como inactivo.`;
      return;
    }
    this.candidateToDelete = candidate;
    this.deleteOpen = true;
  }

  closeDelete(): void {
    if (this.deleting) return;
    this.deleteOpen = false;
    this.candidateToDelete = null;
  }

  confirmDelete(): void {
    const candidate = this.candidateToDelete;
    if (!candidate?.id) return;

    this.deleting = true;
    this.candidatoService
      .eliminar(candidate.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.deleteOpen = false;
          this.candidateToDelete = null;
          this.success = `${candidate.name} fue eliminado correctamente.`;
          this.load(false);
        },
        error: (error: HttpErrorResponse) => {
          this.deleting = false;
          this.deleteOpen = false;
          this.candidateToDelete = null;
          this.error = this.readError(error, 'No se pudo eliminar el candidato.');
        },
      });
  }

  electionTypeLabel(type?: ElectionType | string | null): string {
    switch (type) {
      case 'PRESIDENCIA':
        return 'Presidencia';
      case 'SENADO':
        return 'Senado';
      case 'CAMARA':
        return 'Cámara';
      default:
        return 'Sin tipo';
    }
  }

  electionStateLabel(state?: string | null): string {
    switch (state) {
      case 'CONFIGURADA':
        return 'Configurada';
      case 'ABIERTA':
        return 'Abierta';
      case 'EN_CONTEO':
        return 'En conteo';
      case 'CERRADA':
        return 'Cerrada';
      case 'ARCHIVADA':
        return 'Archivada';
      default:
        return 'Sin estado';
    }
  }

  territory(candidate: Candidate): string {
    if (candidate.electionType === 'CAMARA') {
      return [candidate.department, candidate.municipality].filter(Boolean).join(' · ') || 'Sin definir';
    }
    return 'Nacional';
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  trackCandidate(_: number, candidate: Candidate): number | string {
    return candidate.id ?? candidate.name;
  }

  private validateForm(): FieldErrors {
    const errors: FieldErrors = {};
    const name = this.form.name.trim();
    if (!name) errors.name = 'Ingresa el nombre completo.';
    else if (name.length > 160) errors.name = 'El nombre no puede superar 160 caracteres.';

    if (!this.form.partyId) errors.partyId = 'Selecciona un partido político.';
    if (!this.form.electionId) errors.electionId = 'Selecciona la elección.';

    const election = this.selectedElection;
    if (election?.type === 'PRESIDENCIA' && !this.form.vicePresidentName.trim()) {
      errors.vicePresidentName = 'Ingresa la fórmula vicepresidencial.';
    }
    if (election?.type === 'CAMARA' && !this.form.department.trim()) {
      errors.department = 'Ingresa el departamento o circunscripción.';
    }
    return errors;
  }

  private normalizePage(): void {
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  private emptyForm(): CandidateForm {
    return {
      id: null,
      name: '',
      partyId: null,
      electionId: null,
      vicePresidentName: '',
      department: '',
      municipality: '',
      active: true,
    };
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
