import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-partidos-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidos-analista.html',
  styleUrl: './partidos-analista.scss'
})
export class PartidosAnalista {

  busqueda = '';

  stats = [
    { label: 'Total Partidos',       value: '6',  sub: 'Activos en 2026'      },
    { label: 'Candidatos Total',     value: '185',sub: 'Todos los niveles'     },
    { label: 'Coaliciones',          value: '4',  sub: 'Alianzas electorales'  },
    { label: 'Promedio Candidatos',  value: '31', sub: 'Por partido'           },
  ];

  partidos = [
    { nombre: 'Partido Liberal Colombiano', sigla: 'PL', color: '#DC143C', fundacion: 1848, candidatos: 45 },
    { nombre: 'Centro Democrático',         sigla: 'CD', color: '#0033A0', fundacion: 2013, candidatos: 38 },
    { nombre: 'Pacto Histórico',            sigla: 'PH', color: '#00A651', fundacion: 2021, candidatos: 32 },
    { nombre: 'Cambio Radical',             sigla: 'CR', color: '#FDB913', fundacion: 1998, candidatos: 28 },
    { nombre: 'Partido Conservador',        sigla: 'PC', color: '#0066CC', fundacion: 1849, candidatos: 24 },
    { nombre: 'Alianza Verde',              sigla: 'AV', color: '#00AB66', fundacion: 2009, candidatos: 18 },
  ];

  get partidosFiltrados() {
    return this.partidos.filter(p =>
      p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      p.sigla.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}