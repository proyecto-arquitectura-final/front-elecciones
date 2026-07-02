import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../../core/services/partido.service';
import { CandidatoService } from '../../../core/services/candidato.service';

@Component({
  selector: 'app-partidos-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidos-analista.html',
  styleUrl: './partidos-analista.scss',
})
export class PartidosAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  busqueda = '';
  partidos: Array<{
    nombre: string;
    sigla: string;
    color: string;
    fundacion: number;
    candidatos: number;
    activo: boolean;
  }> = [];
  totalCandidatos = 0;
  error = '';

  constructor(
    private readonly partidoService: PartidoService,
    private readonly candidatoService: CandidatoService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({ partidos: this.partidoService.listar(), candidatos: this.candidatoService.listar() })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.totalCandidatos = data.candidatos.length;
          this.partidos = data.partidos.map((party) => ({
            nombre: party.name,
            sigla: party.acronym,
            color: party.color || '#64748b',
            fundacion: party.foundationYear,
            candidatos: data.candidatos.filter(
              (candidate) => candidate.party?.id === party.id || candidate.partyId === party.id,
            ).length,
            activo: party.active,
          }));
          this.error = '';
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudieron cargar los partidos.';
          console.error(error);
        },
      });
  }

  get stats() {
    return [
      {
        label: 'Total Partidos',
        value: String(this.partidos.length),
        sub: 'Registrados en el sistema',
      },
      {
        label: 'Partidos Activos',
        value: String(this.partidos.filter((p) => p.activo).length),
        sub: 'Con estado habilitado',
      },
      { label: 'Candidatos Total', value: String(this.totalCandidatos), sub: 'Todos los niveles' },
      {
        label: 'Promedio Candidatos',
        value: String(
          this.partidos.length ? Math.round(this.totalCandidatos / this.partidos.length) : 0,
        ),
        sub: 'Por partido',
      },
    ];
  }

  get partidosFiltrados() {
    const search = this.busqueda.trim().toLowerCase();
    return this.partidos.filter(
      (party) =>
        !search ||
        party.nombre.toLowerCase().includes(search) ||
        party.sigla.toLowerCase().includes(search),
    );
  }
}
