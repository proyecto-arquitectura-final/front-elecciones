import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidatos-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatos-analista.html',
  styleUrl: './candidatos-analista.scss'
})
export class CandidatosAnalista {

  busqueda  = '';
  filtroTipo = '';

  candidatos = [
    { id: '#0001', nombre: 'María Fernández',  partido: 'Partido Liberal',    partidoClass: 'liberal',  tipo: 'Presidencia', tipoClass: 'tipo-pres',  territorio: 'Nacional',    votos: 4250000 },
    { id: '#0002', nombre: 'Carlos Rodríguez', partido: 'Centro Democrático', partidoClass: 'centro',   tipo: 'Presidencia', tipoClass: 'tipo-pres',  territorio: 'Nacional',    votos: 3890000 },
    { id: '#0003', nombre: 'Ana López',        partido: 'Pacto Histórico',    partidoClass: 'pacto',    tipo: 'Presidencia', tipoClass: 'tipo-pres',  territorio: 'Nacional',    votos: 1980000 },
    { id: '#0004', nombre: 'Pedro Gómez',      partido: 'Cambio Radical',     partidoClass: 'cambio',   tipo: 'Presidencia', tipoClass: 'tipo-pres',  territorio: 'Nacional',    votos:  920000 },
    { id: '#0005', nombre: 'Roberto Martínez', partido: 'Partido Liberal',    partidoClass: 'liberal',  tipo: 'Senado',      tipoClass: 'tipo-sen',   territorio: 'Nacional',    votos:  580000 },
    { id: '#0006', nombre: 'Laura Sánchez',    partido: 'Verde',              partidoClass: 'verde',    tipo: 'Senado',      tipoClass: 'tipo-sen',   territorio: 'Nacional',    votos:  425000 },
    { id: '#0007', nombre: 'Diego Vargas',     partido: 'Centro Democrático', partidoClass: 'centro',   tipo: 'Cámara',      tipoClass: 'tipo-cam',   territorio: 'Antioquia',   votos:  180000 },
    { id: '#0008', nombre: 'Carmen Torres',    partido: 'Pacto Histórico',    partidoClass: 'pacto',    tipo: 'Cámara',      tipoClass: 'tipo-cam',   territorio: 'Bogotá D.C.', votos:  220000 },
  ];

  get candidatosFiltrados() {
    return this.candidatos.filter(c => {
      const matchB = c.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                     c.partido.toLowerCase().includes(this.busqueda.toLowerCase());
      const matchT = !this.filtroTipo || c.tipo === this.filtroTipo;
      return matchB && matchT;
    });
  }

  get distribucion() {
    const map: any = {};
    this.candidatos.forEach(c => { map[c.partido] = (map[c.partido] || 0) + 1; });
    return Object.entries(map).map(([partido, count]) => ({ partido, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }
}