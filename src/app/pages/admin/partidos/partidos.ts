import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { refreshView } from '../../../core/utils/zoneless-view.util';
import { Party } from '../../../core/models/party.model';
import { Candidate } from '../../../core/models/candidate.model';
import { PartidoService } from '../../../core/services/partido.service';
import { CandidatoService } from '../../../core/services/candidato.service';

interface PartyView {
  id?: number;
  nombre: string;
  sigla: string;
  color: string;
  fundacion: number;
  candidatos: number;
  activo: boolean;
}

interface PartyForm {
  id: number | null;
  nombre: string;
  sigla: string;
  color: string;
  fundacion: number | null;
  candidatos: number;
  activo: boolean;
}

interface PartyColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidos.html',
  styleUrl: './partidos.scss',
})
export class Partidos implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly currentYear = new Date().getFullYear();

  readonly colores: PartyColor[] = [
    { name: 'Azul electoral', value: '#2563EB' },
    { name: 'Azul profundo', value: '#1D4ED8' },
    { name: 'Verde', value: '#16A34A' },
    { name: 'Esmeralda', value: '#059669' },
    { name: 'Rojo', value: '#DC2626' },
    { name: 'Rosa', value: '#E11D48' },
    { name: 'Ámbar', value: '#F59E0B' },
    { name: 'Naranja', value: '#EA580C' },
    { name: 'Violeta', value: '#7C3AED' },
    { name: 'Púrpura', value: '#9333EA' },
    { name: 'Cian', value: '#0891B2' },
    { name: 'Gris', value: '#475569' },
  ];

  busqueda = '';
  modalAbierto = false;
  modoEdicion = false;
  cargando = false;
  guardando = false;
  error = '';

  form: PartyForm = this.formVacio();
  partidos: PartyView[] = [];
  totalCandidatos = 0;

  constructor(
    private readonly partidoService: PartidoService,
    private readonly candidatoService: CandidatoService,
  ) {}

  ngOnInit(): void {
    this.cargarPartidos();
  }

  get stats() {
    const activos = this.partidos.filter((party) => party.activo).length;
    const conCandidatos = this.partidos.filter((party) => party.candidatos > 0).length;
    const sinCandidatos = this.partidos.length - conCandidatos;

    return [
      {
        label: 'Total Partidos',
        value: String(this.partidos.length),
        sub: 'Registros persistidos',
      },
      {
        label: 'Partidos Activos',
        value: String(activos),
        sub: 'Disponibles para asignación',
      },
      {
        label: 'Candidatos Vinculados',
        value: String(this.totalCandidatos),
        sub: 'Calculados desde candidatos',
      },
      {
        label: 'Sin Candidatos',
        value: String(sinCandidatos),
        sub: 'Partidos que requieren revisión',
      },
    ];
  }

  get partidosFiltrados(): PartyView[] {
    const search = this.busqueda.trim().toLowerCase();
    return this.partidos.filter(
      (party) =>
        !search ||
        party.nombre.toLowerCase().includes(search) ||
        party.sigla.toLowerCase().includes(search),
    );
  }

  cargarPartidos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      partidos: this.partidoService.listar(),
      candidatos: this.candidatoService.listar(),
    })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: ({ partidos, candidatos }) => {
          this.totalCandidatos = candidatos.length;
          this.partidos = partidos.map((party) => this.toView(party, candidatos));
          this.cargando = false;
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            'No se pudieron cargar los partidos y sus candidatos asociados.';
          this.cargando = false;
          console.error('Error cargando partidos:', err);
        },
      });
  }

  abrirModal(partido?: PartyView): void {
    this.modoEdicion = !!partido;
    this.form = partido
      ? {
          id: partido.id ?? null,
          nombre: partido.nombre,
          sigla: partido.sigla,
          color: this.normalizarColor(partido.color),
          fundacion: partido.fundacion,
          candidatos: partido.candidatos,
          activo: partido.activo,
        }
      : this.formVacio();
    this.error = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbierto = false;
    this.error = '';
  }

  seleccionarColor(color: string): void {
    this.form.color = this.normalizarColor(color);
  }

  esColorSeleccionado(color: string): boolean {
    return this.normalizarColor(this.form.color) === this.normalizarColor(color);
  }

  guardar(): void {
    const nombre = this.form.nombre.trim();
    const sigla = this.form.sigla.trim().toUpperCase();
    const foundationYear = Number(this.form.fundacion);

    if (!nombre || !sigla || !foundationYear) {
      this.error = 'Completa el nombre, la sigla y el año de fundación.';
      return;
    }

    if (foundationYear < 1800 || foundationYear > this.currentYear) {
      this.error = `El año de fundación debe estar entre 1800 y ${this.currentYear}.`;
      return;
    }

    const request: Party = {
      name: nombre,
      acronym: sigla,
      color: this.normalizarColor(this.form.color),
      foundationYear,
      active: this.form.activo,
    };

    const action$ =
      this.modoEdicion && this.form.id
        ? this.partidoService.actualizar(this.form.id, request)
        : this.partidoService.crear(request);

    this.guardando = true;
    this.error = '';

    action$.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.cargarPartidos();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.error?.message || 'No se pudo guardar el partido.';
        console.error('Error guardando partido:', err);
      },
    });
  }

  eliminar(partido: PartyView): void {
    if (!partido.id) return;

    if (partido.candidatos > 0) {
      this.error =
        `No puedes eliminar ${partido.nombre} porque tiene ` +
        `${this.textoCandidatos(partido.candidatos)} asociado(s). Puedes marcarlo como inactivo.`;
      return;
    }

    if (!confirm(`¿Eliminar "${partido.nombre}"? Esta acción no se puede deshacer.`)) return;

    this.partidoService
      .eliminar(partido.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => this.cargarPartidos(),
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo eliminar el partido.';
          console.error('Error eliminando partido:', err);
        },
      });
  }

  textoCandidatos(cantidad: number): string {
    return cantidad === 1 ? '1 candidato' : `${cantidad} candidatos`;
  }

  private toView(party: Party, candidatos: Candidate[]): PartyView {
    const partyId = party.id;
    const total = partyId
      ? candidatos.filter(
          (candidate) => candidate.party?.id === partyId || candidate.partyId === partyId,
        ).length
      : 0;

    return {
      id: party.id,
      nombre: party.name,
      sigla: party.acronym,
      color: this.normalizarColor(party.color),
      fundacion: party.foundationYear,
      candidatos: total,
      activo: party.active,
    };
  }

  private normalizarColor(color?: string | null): string {
    const value = color?.trim().toUpperCase() || '#2563EB';
    return /^#[0-9A-F]{6}$/.test(value) ? value : '#2563EB';
  }

  private formVacio(): PartyForm {
    return {
      id: null,
      nombre: '',
      sigla: '',
      color: '#2563EB',
      fundacion: null,
      candidatos: 0,
      activo: true,
    };
  }
}
