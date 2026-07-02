import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EleccionService } from '../../../core/services/eleccion.service';
import {
  Election,
  ElectionRound,
  ElectionState,
  ElectionType,
} from '../../../core/models/election.model';

@Component({
  selector: 'app-elecciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elecciones.html',
  styleUrl: './elecciones.scss',
})
export class Elecciones implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  modalAbierto = false;
  modoEdicion = false;
  error = '';
  form: any = this.formVacio();
  elecciones: Election[] = [];

  configuracion = [
    {
      icon: '🗳',
      titulo: 'Iniciar Conteo',
      descripcion: 'Activar recepción de resultados',
    },
    {
      icon: '⚙',
      titulo: 'Configurar Mesas',
      descripcion: 'Asignar puestos de votación',
    },
    {
      icon: '📅',
      titulo: 'Programar Segunda Vuelta',
      descripcion: 'Configurar balotaje',
    },
  ];

  constructor(private readonly eleccionService: EleccionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.eleccionService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.elecciones = data;
        },
        error: (e) => {
          this.error = 'No se pudieron cargar las elecciones';
          console.error(e);
        },
      });
  }

  get activas(): number {
    return this.elecciones.filter((e) => e.state === 'ABIERTA' || e.state === 'EN_CONTEO').length;
  }

  get programadas(): number {
    return this.elecciones.filter((e) => e.state === 'CONFIGURADA').length;
  }

  abrirModal(e?: Election): void {
    this.error = '';
    this.modoEdicion = !!e;

    this.form = e
      ? {
          id: e.id,
          nombre: e.name,
          tipo: this.toVistaTipo(e.type),
          ronda: this.toVistaRonda(e.round),
          fecha: e.electionDate,
          estado: this.toVistaEstado(e.state),
        }
      : this.formVacio();

    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.error = '';
    this.form = this.formVacio();
  }

  guardar(): void {
    if (!this.form.nombre || !this.form.tipo || !this.form.fecha) {
      this.error = 'Completa nombre, tipo y fecha.';
      return;
    }

    const req: Election = {
      name: this.form.nombre,
      type: this.toApiTipo(this.form.tipo),
      round: this.toApiRonda(this.form.ronda),
      electionDate: this.form.fecha,
      state: this.toApiEstado(this.form.estado),
    };

    const obs =
      this.modoEdicion && this.form.id
        ? this.eleccionService.actualizar(this.form.id, req)
        : this.eleccionService.crear(req);

    obs.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo guardar la elección';
        console.error(e);
      },
    });
  }

  eliminar(e: Election): void {
    if (!e.id || !confirm(`¿Eliminar "${e.name}"?`)) {
      return;
    }

    this.eleccionService
      .eliminar(e.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => this.cargar(),
        error: (x) => {
          this.error = x?.error?.message || 'No se pudo eliminar';
          console.error(x);
        },
      });
  }

  toVistaTipo(t?: string): string {
    switch (t) {
      case 'PRESIDENCIA':
        return 'Presidencia';
      case 'SENADO':
        return 'Senado';
      case 'CAMARA':
        return 'Cámara';
      default:
        return '';
    }
  }

  toApiTipo(t: string): ElectionType {
    switch (t) {
      case 'Presidencia':
      case 'PRESIDENCIA':
        return 'PRESIDENCIA';
      case 'Senado':
      case 'SENADO':
        return 'SENADO';
      case 'Cámara':
      case 'Camara':
      case 'CAMARA':
        return 'CAMARA';
      default:
        return 'CAMARA';
    }
  }

  toVistaRonda(r?: string): string {
    switch (r) {
      case 'PRIMERA':
        return 'Primera Vuelta';
      case 'SEGUNDA':
        return 'Segunda Vuelta';
      case 'NINGUNA':
        return 'Ninguna';
      default:
        return 'Ninguna';
    }
  }

  toApiRonda(r: string): ElectionRound {
    switch (r) {
      case 'Primera Vuelta':
      case 'PRIMERA':
      case 'PRIMERA_VUELTA':
        return 'PRIMERA';
      case 'Segunda Vuelta':
      case 'SEGUNDA':
      case 'SEGUNDA_VUELTA':
        return 'SEGUNDA';
      case 'Ninguna':
      case 'No Aplica':
      case 'NINGUNA':
      default:
        return 'NINGUNA';
    }
  }

  toVistaEstado(s?: string): string {
    switch (s) {
      case 'CONFIGURADA':
        return 'Programada';
      case 'ABIERTA':
        return 'Abierta';
      case 'EN_CONTEO':
        return 'En Conteo';
      case 'CERRADA':
        return 'Cerrada';
      case 'ARCHIVADA':
        return 'Archivada';
      default:
        return 'Programada';
    }
  }

  toApiEstado(s: string): ElectionState {
    switch (s) {
      case 'Programada':
      case 'Configurada':
      case 'CONFIGURADA':
        return 'CONFIGURADA';
      case 'Activa':
      case 'Abierta':
      case 'ABIERTA':
      case 'ACTIVA':
        return 'ABIERTA';
      case 'En Conteo':
      case 'EN_CONTEO':
        return 'EN_CONTEO';
      case 'Finalizada':
      case 'Cerrada':
      case 'CERRADA':
      case 'FINALIZADA':
        return 'CERRADA';
      case 'Archivada':
      case 'ARCHIVADA':
        return 'ARCHIVADA';
      default:
        return 'CONFIGURADA';
    }
  }

  tipoClass(t?: string): string {
    switch (t) {
      case 'PRESIDENCIA':
        return 'tag-presidencia';
      case 'SENADO':
        return 'tag-senado';
      case 'CAMARA':
        return 'tag-camara';
      default:
        return 'tag-camara';
    }
  }

  progreso(e: Election): number {
    switch (e.state) {
      case 'CONFIGURADA':
        return 0;
      case 'ABIERTA':
        return 25;
      case 'EN_CONTEO':
        return 75;
      case 'CERRADA':
        return 100;
      case 'ARCHIVADA':
        return 100;
      default:
        return 0;
    }
  }

  private formVacio() {
    return {
      id: null,
      nombre: '',
      tipo: '',
      ronda: 'Primera Vuelta',
      fecha: '',
      estado: 'Programada',
    };
  }
}
