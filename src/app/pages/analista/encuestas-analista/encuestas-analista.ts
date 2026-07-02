import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-encuestas-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuestas-analista.html',
  styleUrl: './encuestas-analista.scss'
})
export class EncuestasAnalista {

  busqueda = '';

  encuestas = [
    { id: '#0001', fuente: 'Centro Nacional de Consultoría', fecha: '15 Mar 2026', muestra: 2500, margen: '±2%',   metodologia: 'Telefónica', estado: 'Aprobada'  },
    { id: '#0002', fuente: 'Invamer',                         fecha: '18 Mar 2026', muestra: 3200, margen: '±1.8%', metodologia: 'Presencial', estado: 'Aprobada'  },
    { id: '#0003', fuente: 'YanHaas',                         fecha: '20 Mar 2026', muestra: 2800, margen: '±1.9%', metodologia: 'Digital',    estado: 'Aprobada'  },
    { id: '#0004', fuente: 'Cifras y Conceptos',              fecha: '12 Mar 2026', muestra: 2200, margen: '±2.1%', metodologia: 'Mixta',      estado: 'Aprobada'  },
    { id: '#0005', fuente: 'Guarumo',                         fecha: '22 Mar 2026', muestra: 1800, margen: '±2.3%', metodologia: 'Telefónica', estado: 'Pendiente' },
  ];

  get encuestasFiltradas() { return this.encuestas.filter(e => e.fuente.toLowerCase().includes(this.busqueda.toLowerCase())); }
  get aprobadas()      { return this.encuestas.filter(e => e.estado === 'Aprobada').length; }
  get pendientes()     { return this.encuestas.filter(e => e.estado === 'Pendiente').length; }
  get pctAprobadas()   { return Math.round(this.aprobadas / this.encuestas.length * 100 * 10) / 10; }
  get muestraPromedio(){ return Math.round(this.encuestas.reduce((s, e) => s + e.muestra, 0) / this.encuestas.length); }

  intencionVoto = [
    { nombre: 'María Fernández',  pct: 36, colorClass: 'blue'   },
    { nombre: 'Carlos Rodríguez', pct: 34, colorClass: 'red'    },
    { nombre: 'Ana López',        pct: 18, colorClass: 'green'  },
    { nombre: 'Pedro Gómez',      pct: 12, colorClass: 'orange' },
  ];

  detallesMetod = [
    { label: 'Fuente',              value: 'Centro Nacional de Consultoría' },
    { label: 'Fecha de Realización',value: '15 Mar 2026'                   },
    { label: 'Tamaño de Muestra',   value: '2500 personas'                 },
    { label: 'Margen de Error',     value: '±2%'                           },
    { label: 'Metodología',         value: 'Telefónica'                    },
    { label: 'Nivel de Confianza',  value: '95%'                           },
  ];
}