import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultadoService } from '../../../core/services/resultado.service';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { OfficialResult } from '../../../core/models/result.model';
import { Election } from '../../../core/models/election.model';
import { Candidate } from '../../../core/models/candidate.model';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss',
})
export class Resultados implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  resultados: OfficialResult[] = [];
  elecciones: Election[] = [];
  candidatos: Candidate[] = [];
  modalAbierto = false;
  sincronizando = false;
  error = '';
  mensaje = '';
  form: any = this.formVacio();

  cargaOpciones = [
    {
      icon: '⬆',
      iconClass: 'icon-blue',
      titulo: 'Carga Manual',
      sub: 'Registrar resultado oficial',
    },
    {
      icon: '🔄',
      iconClass: 'icon-green',
      titulo: 'API Registraduría',
      sub: 'Sincronizar datos disponibles',
    },
    {
      icon: '⬇',
      iconClass: 'icon-purple',
      titulo: 'Exportar Consolidado',
      sub: 'Disponible en el módulo de reportes',
    },
  ];

  constructor(
    private readonly resultadoService: ResultadoService,
    private readonly eleccionService: EleccionService,
    private readonly candidatoService: CandidatoService,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.eleccionService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe((data) => (this.elecciones = data));
    this.candidatoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe((data) => (this.candidatos = data.filter((candidate) => candidate.active)));
  }

  cargar(): void {
    this.resultadoService
      .listar()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.resultados = [...data].sort(
            (a, b) =>
              this.time(b.importedAt || b.createdAt) - this.time(a.importedAt || a.createdAt),
          );
          this.error = '';
        },
        error: (error) => {
          this.error = 'No se pudieron cargar los resultados.';
          console.error(error);
        },
      });
  }

  get votosTotales(): number {
    return this.resultados.reduce((sum, result) => sum + (result.votes || 0), 0);
  }

  get mesasReportadas(): number {
    return this.territorios.reduce((sum, item) => sum + item.reported, 0);
  }

  get mesasTotales(): number {
    return this.territorios.reduce((sum, item) => sum + item.total, 0);
  }

  get pctMesas(): number {
    return this.mesasTotales
      ? Math.round((this.mesasReportadas * 1000) / this.mesasTotales) / 10
      : 0;
  }

  abrirModal(): void {
    this.form = this.formVacio();
    this.modalAbierto = true;
    this.error = '';
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.error = '';
  }

  guardar(): void {
    if (!this.form.electionId || !this.form.candidateId) {
      this.error = 'Selecciona elección y candidato.';
      return;
    }
    if (Number(this.form.reportedTables) > Number(this.form.totalTables)) {
      this.error = 'Las mesas reportadas no pueden superar el total de mesas.';
      return;
    }

    const request: OfficialResult = {
      electionId: Number(this.form.electionId),
      candidateId: Number(this.form.candidateId),
      department: this.form.department.trim(),
      municipality: this.form.municipality.trim(),
      votes: Number(this.form.votes || 0),
      percentage: Number(this.form.percentage || 0),
      reportedTables: Number(this.form.reportedTables || 0),
      totalTables: Number(this.form.totalTables || 0),
      participation: Number(this.form.participation || 0),
      source: 'MANUAL_FRONT',
    };

    this.resultadoService
      .crear(request)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.mensaje = 'Resultado guardado correctamente.';
          this.cargar();
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudo guardar el resultado.';
          console.error(error);
        },
      });
  }

  sincronizar(): void {
    if (this.sincronizando) return;
    this.sincronizando = true;
    this.error = '';
    this.resultadoService
      .sincronizarRegistraduria()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (count) => {
          this.sincronizando = false;
          this.mensaje = `Sincronización ejecutada. Registros disponibles: ${count}.`;
          this.cargar();
        },
        error: (error) => {
          this.sincronizando = false;
          this.error = error?.error?.message || 'No se pudo sincronizar.';
          console.error(error);
        },
      });
  }

  getValidClass(): string {
    return 'badge-aprobado';
  }

  private get territorios(): Array<{ reported: number; total: number }> {
    const grouped = new Map<string, { reported: number; total: number }>();
    for (const result of this.resultados) {
      const electionId = result.election?.id || result.electionId || 0;
      const key = `${electionId}|${result.department || ''}|${result.municipality || ''}`;
      const current = grouped.get(key) || { reported: 0, total: 0 };
      current.reported = Math.max(current.reported, result.reportedTables || 0);
      current.total = Math.max(current.total, result.totalTables || 0);
      grouped.set(key, current);
    }
    return [...grouped.values()];
  }

  private formVacio() {
    return {
      electionId: '',
      candidateId: '',
      department: 'Quindío',
      municipality: 'Armenia',
      votes: 0,
      percentage: 0,
      reportedTables: 0,
      totalTables: 0,
      participation: 0,
    };
  }

  private time(value?: string): number {
    return value ? new Date(value).getTime() : 0;
  }
}
