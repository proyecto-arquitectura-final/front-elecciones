import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CandidatoService } from '../../../core/services/candidato.service';
import { ResultadoService } from '../../../core/services/resultado.service';

interface CandidateView {
  id: string;
  nombre: string;
  partido: string;
  partidoColor: string;
  tipo: string;
  tipoClass: string;
  territorio: string;
  votos: number;
  activo: boolean;
}

@Component({
  selector: 'app-candidatos-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatos-analista.html',
  styleUrl: './candidatos-analista.scss',
})
export class CandidatosAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  busqueda = '';
  filtroTipo = '';
  candidatos: CandidateView[] = [];
  error = '';

  constructor(
    private readonly candidatoService: CandidatoService,
    private readonly resultadoService: ResultadoService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({
      candidatos: this.candidatoService.listar(),
      resultados: this.resultadoService.listar(),
    })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          const votes = new Map<number, number>();
          data.resultados.forEach((result) => {
            const id = result.candidate?.id || result.candidateId;
            if (id) votes.set(id, (votes.get(id) || 0) + (result.votes || 0));
          });

          this.candidatos = data.candidatos.map((candidate, index) => ({
            id: `#${String(candidate.id || 0).padStart(4, '0')}`,
            nombre: candidate.name,
            partido: candidate.party?.name || 'Sin partido',
            partidoColor: candidate.party?.color || this.fallbackColor(index),
            tipo: this.formatType(candidate.electionType),
            tipoClass:
              candidate.electionType === 'PRESIDENCIA'
                ? 'tipo-pres'
                : candidate.electionType === 'SENADO'
                  ? 'tipo-sen'
                  : 'tipo-cam',
            territorio:
              candidate.electionType === 'CAMARA'
                ? [candidate.municipality, candidate.department].filter(Boolean).join(', ') ||
                  'Regional'
                : 'Nacional',
            votos: candidate.id ? votes.get(candidate.id) || 0 : 0,
            activo: candidate.active,
          }));
          this.error = '';
        },
        error: (error) => {
          this.error = error?.error?.message || 'No se pudieron cargar los candidatos.';
          console.error(error);
        },
      });
  }

  get candidatosFiltrados(): CandidateView[] {
    const search = this.busqueda.trim().toLowerCase();
    return this.candidatos.filter((candidate) => {
      const matchSearch =
        !search ||
        candidate.nombre.toLowerCase().includes(search) ||
        candidate.partido.toLowerCase().includes(search);
      return matchSearch && (!this.filtroTipo || candidate.tipo === this.filtroTipo);
    });
  }

  get totalPresidencia(): number {
    return this.candidatos.filter((c) => c.tipo === 'Presidencia').length;
  }
  get totalSenado(): number {
    return this.candidatos.filter((c) => c.tipo === 'Senado').length;
  }
  get totalCamara(): number {
    return this.candidatos.filter((c) => c.tipo === 'Cámara').length;
  }

  get distribucion() {
    const map = new Map<string, { count: number; color: string }>();
    this.candidatos.forEach((candidate) => {
      const current = map.get(candidate.partido) || { count: 0, color: candidate.partidoColor };
      current.count += 1;
      map.set(candidate.partido, current);
    });
    return [...map.entries()]
      .map(([partido, data]) => ({ partido, count: data.count, color: data.color }))
      .sort((a, b) => b.count - a.count);
  }

  private fallbackColor(index: number): string {
    const palette = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];
    return palette[index % palette.length];
  }

  private formatType(type: string): string {
    return type === 'CAMARA' ? 'Cámara' : type.charAt(0) + type.slice(1).toLowerCase();
  }
}
