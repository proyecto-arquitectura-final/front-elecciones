import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes-analista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-analista.html',
  styleUrl: './reportes-analista.scss'
})
export class ReportesAnalista {

  stats = [
    { label: 'Reportes Generados', value: '342', sub: 'Últimos 30 días',      icon: '📄', iconClass: 'icon-blue'   },
    { label: 'Formato Más Usado',  value: 'PDF', sub: '58% de las descargas', icon: '📕', iconClass: 'icon-red'    },
    { label: 'CSV Exportados',     value: '128', sub: 'Este mes',              icon: '📗', iconClass: 'icon-green'  },
    { label: 'JSON Generados',     value: '86',  sub: 'Para integraciones',    icon: '📘', iconClass: 'icon-purple' },
  ];

  reportes = [
    { icon: '🗳', iconClass: 'icon-blue',   titulo: 'Reporte de Resultados Consolidados',   descripcion: 'Resultados completos por elección, candidato y territorio', formatos: ['PDF','CSV','JSON'], ultimoGenerado: '23 Mar 2026, 14:30' },
    { icon: '📈', iconClass: 'icon-green',  titulo: 'Análisis de Encuestas Pre-Electorales', descripcion: 'Agregado de encuestas con tendencias y proyecciones',       formatos: ['PDF','CSV'],        ultimoGenerado: '22 Mar 2026, 18:45' },
    { icon: '👥', iconClass: 'icon-purple', titulo: 'Participación Electoral',               descripcion: 'Estadísticas de votación por departamento y demografía',    formatos: ['PDF','CSV','JSON'], ultimoGenerado: '23 Mar 2026, 14:15' },
    { icon: '📋', iconClass: 'icon-orange', titulo: 'Reporte de Auditoría',                  descripcion: 'Log completo de operaciones y accesos al sistema',           formatos: ['PDF','CSV'],        ultimoGenerado: '23 Mar 2026, 14:00' },
  ];

  regionData = [
    { region: 'Bogotá',    votos: 4850000, participacion: 68 },
    { region: 'Antioquia', votos: 4200000, participacion: 71 },
    { region: 'Valle',     votos: 3100000, participacion: 65 },
    { region: 'Atlántico', votos: 1850000, participacion: 62 },
    { region: 'Santander', votos: 1650000, participacion: 69 },
  ];
}