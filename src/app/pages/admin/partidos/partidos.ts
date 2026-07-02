import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Party } from '../../../core/models/party.model';
import { PartidoService } from '../../../core/services/partido.service';

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidos.html',
  styleUrl: './partidos.scss',
})
export class Partidos implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  stats = [
    { label: 'Total Partidos', value: '0', sub: 'Activos en 2026' },
    { label: 'Candidatos Total', value: '0', sub: 'Todos los niveles' },
    { label: 'Coaliciones', value: '0', sub: 'Alianzas electorales' },
    { label: 'En Verificación', value: '0', sub: 'Pendientes CNE' },
  ];

  busqueda = '';
  modalAbierto = false;
  modoEdicion = false;
  cargando = false;
  error = '';

  form = this.formVacio();
  partidos: any[] = [];

  constructor(private readonly partidoService: PartidoService) {}

  ngOnInit(): void {
    this.cargarPartidos();
  }

  get partidosFiltrados() {
    return this.partidos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        p.sigla.toLowerCase().includes(this.busqueda.toLowerCase()),
    );
  }

  cargarPartidos(): void {
    this.cargando = true;
    this.partidoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.partidos = data.map((p) => this.toView(p));
          this.stats[0].value = String(this.partidos.filter((p) => p.activo).length);
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los partidos.';
          this.cargando = false;
          console.error('Error cargando partidos:', err);
        },
      });
  }

  abrirModal(partido?: any) {
    this.modoEdicion = !!partido;
    this.form = partido ? { ...partido } : this.formVacio();
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.error = '';
  }

  guardar() {
    if (!this.form.nombre || !this.form.sigla || !this.form.fundacion) return;

    const request: Party = {
      name: this.form.nombre,
      acronym: this.form.sigla,
      color: this.form.color,
      foundationYear: Number(this.form.fundacion),
      active: this.form.activo,
    };

    const action$ =
      this.modoEdicion && this.form.id
        ? this.partidoService.actualizar(this.form.id, request)
        : this.partidoService.crear(request);

    action$.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarPartidos();
      },
      error: (err) => {
        this.error = 'No se pudo guardar el partido.';
        console.error('Error guardando partido:', err);
      },
    });
  }

  eliminar(partido: any) {
    if (!partido.id) return;

    if (confirm(`¿Eliminar "${partido.nombre}"?`)) {
      this.partidoService
        .eliminar(partido.id)
        .pipe(refreshView(this.cdr))
        .subscribe({
          next: () => this.cargarPartidos(),
          error: (err) => {
            this.error = 'No se pudo eliminar el partido.';
            console.error('Error eliminando partido:', err);
          },
        });
    }
  }

  private toView(p: Party): any {
    return {
      id: p.id,
      nombre: p.name,
      sigla: p.acronym,
      color: p.color,
      fundacion: p.foundationYear,
      candidatos: 0,
      activo: p.active,
    };
  }

  private formVacio() {
    return {
      id: null as number | null,
      nombre: '',
      sigla: '',
      color: '#2563eb',
      fundacion: null as number | null,
      candidatos: 0,
      activo: true,
    };
  }
}
