import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estadisticas-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas-analista.html',
  styleUrl: './estadisticas-analista.scss'
})
export class EstadisticasAnalista {

  stats = [
    { label: 'Variación promedio semanal (Petro)',  value: '±1.9 pp', trend: '↗ Baja volatilidad',  valueClass: '',       trendClass: 'trend-gray'   },
    { label: 'Variación promedio semanal (Hdez.)',  value: '±2.7 pp', trend: '↗ Alta volatilidad',  valueClass: 'orange', trendClass: 'trend-orange' },
    { label: 'Brecha líder-segundo',                value: '13 pp',   trend: '↗ Creciendo',         valueClass: '',       trendClass: 'trend-orange' },
    { label: 'Indecisión declarada',                value: '8.3%',    trend: '↗ Bajando',           valueClass: '',       trendClass: 'trend-green'  },
  ];

  semanas = [
    { label: 'S1', valor: 1.7  },
    { label: 'S2', valor: 1.5  },
    { label: 'S3', valor: 2.55 },
    { label: 'S4', valor: 0.85 },
    { label: 'S5', valor: 1.7  },
    { label: 'S6', valor: 1.8  },
    { label: 'S7', valor: 1.6  },
    { label: 'S8', valor: 1.7  },
  ];

  gruposEtarios = [
    { grupo: '18-25', pct: 48 },
    { grupo: '26-35', pct: 40 },
    { grupo: '36-45', pct: 33 },
    { grupo: '46-55', pct: 28 },
    { grupo: '56-65', pct: 23 },
    { grupo: '65+',   pct: 18 },
  ];
}