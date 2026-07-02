import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidatoService } from '../../../core/services/candidato.service';
import { PartidoService } from '../../../core/services/partido.service';
import { Candidate } from '../../../core/models/candidate.model';
import { Party } from '../../../core/models/party.model';
import { ElectionType } from '../../../core/models/election.model';

@Component({
  selector: 'app-candidatos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatos.html',
  styleUrl: './candidatos.scss',
})
export class Candidatos implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  busqueda = '';
  filtroEleccion = '';
  modalAbierto = false;
  modoEdicion = false;
  cargando = false;
  error = '';
  partidos: Party[] = [];
  candidatos: Candidate[] = [];
  form: any = this.formVacio();

  constructor(
    private readonly candidatoService: CandidatoService,
    private readonly partidoService: PartidoService,
  ) {}
  ngOnInit(): void {
    this.cargar();
    this.cargarPartidos();
  }

  cargar(): void {
    this.cargando = true;
    this.candidatoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (d) => {
          this.candidatos = d;
          this.cargando = false;
        },
        error: (e) => {
          this.error = 'No se pudieron cargar los candidatos';
          this.cargando = false;
          console.error(e);
        },
      });
  }
  cargarPartidos(): void {
    this.partidoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({ next: (d) => (this.partidos = d), error: (e) => console.error(e) });
  }

  get candidatosFiltrados(): Candidate[] {
    const b = this.busqueda.toLowerCase();
    return this.candidatos.filter(
      (c) =>
        (!b ||
          c.name.toLowerCase().includes(b) ||
          (c.party?.name || '').toLowerCase().includes(b)) &&
        (!this.filtroEleccion || c.electionType === this.toApiTipo(this.filtroEleccion)),
    );
  }
  get totalPresidencia() {
    return this.candidatos.filter((c) => c.electionType === 'PRESIDENCIA').length;
  }
  get totalSenado() {
    return this.candidatos.filter((c) => c.electionType === 'SENADO').length;
  }
  get totalCamara() {
    return this.candidatos.filter((c) => c.electionType === 'CAMARA').length;
  }

  abrirModal(c?: Candidate): void {
    this.modoEdicion = !!c;
    this.form = c
      ? {
          id: c.id,
          nombre: c.name,
          partidoId: c.party?.id,
          tipo: this.toVistaTipo(c.electionType),
          territorio: c.department || 'Nacional',
          municipio: c.municipality || '',
          vicepresidente: c.vicePresidentName || '',
          active: c.active,
        }
      : this.formVacio();
    this.modalAbierto = true;
  }
  cerrarModal(): void {
    this.modalAbierto = false;
    this.error = '';
  }
  guardar(): void {
    if (!this.form.nombre || !this.form.partidoId || !this.form.tipo) {
      this.error = 'Completa nombre, partido y tipo de elección.';
      return;
    }
    const req: Candidate = {
      name: this.form.nombre,
      partyId: Number(this.form.partidoId),
      electionType: this.toApiTipo(this.form.tipo),
      department: this.form.territorio,
      municipality: this.form.municipio,
      vicePresidentName: this.form.vicepresidente,
      active: this.form.active ?? true,
    };
    const obs =
      this.modoEdicion && this.form.id
        ? this.candidatoService.actualizar(this.form.id, req)
        : this.candidatoService.crear(req);
    obs.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
      },
      error: (e) => {
        this.error = 'No se pudo guardar el candidato';
        console.error(e);
      },
    });
  }
  eliminar(c: Candidate): void {
    if (!c.id || !confirm(`¿Eliminar a "${c.name}"?`)) return;
    this.candidatoService
      .eliminar(c.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => this.cargar(),
        error: (e) => {
          this.error = 'No se pudo eliminar el candidato';
          console.error(e);
        },
      });
  }

  toVistaTipo(t?: string): string {
    return t === 'PRESIDENCIA'
      ? 'Presidencia'
      : t === 'SENADO'
        ? 'Senado'
        : t === 'CAMARA'
          ? 'Cámara'
          : '';
  }
  toApiTipo(t: string): ElectionType {
    return t === 'Presidencia' ? 'PRESIDENCIA' : t === 'Senado' ? 'SENADO' : 'CAMARA';
  }
  tipoClass(t?: string): string {
    return t === 'PRESIDENCIA' ? 'tag-presidencia' : t === 'SENADO' ? 'tag-senado' : 'tag-camara';
  }
  territorio(c: Candidate): string {
    return c.department || c.municipality || 'Nacional';
  }
  private formVacio() {
    return {
      id: null,
      nombre: '',
      partidoId: '',
      tipo: '',
      territorio: 'Nacional',
      municipio: '',
      vicepresidente: '',
      active: true,
    };
  }
}
