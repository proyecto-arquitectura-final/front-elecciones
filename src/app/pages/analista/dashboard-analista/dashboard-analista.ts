import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-analista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-analista.html',
  styleUrl: './dashboard-analista.scss'
})
export class DashboardAnalista {

  fechaHoy = new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  actualizar() { window.location.reload(); }

  stats = [
    { icon: '📋', iconClass: 'icon-green',  value: '12', label: 'Encuestas Activas',       trend: '↑ +3 este mes',    trendClass: 'trend-up'   },
    { icon: '👥', iconClass: 'icon-blue',   value: '8',  label: 'Candidatos Registrados',  trend: '2 pendientes',     trendClass: 'trend-gray' },
    { icon: '🔮', iconClass: 'icon-purple', value: '47', label: 'Proyecciones Generadas',  trend: '↑ +12 esta semana',trendClass: 'trend-up'   },
    { icon: '📄', iconClass: 'icon-orange', value: '28', label: 'Reportes Exportados',     trend: 'Último: hoy',      trendClass: 'trend-gray' },
  ];

  // ── Gráfica de línea ────────────────────────────────────
  meses = [
    { label: 'Nov', x: 90  },
    { label: 'Dic', x: 182 },
    { label: 'Ene', x: 274 },
    { label: 'Feb', x: 366 },
    { label: 'Mar', x: 458 },
    { label: 'Abr', x: 550 },
    { label: 'May', x: 642 },
  ];

  gridY = [
    { label: '40%', py: 20  },
    { label: '30%', py: 70  },
    { label: '20%', py: 120 },
    { label: '10%', py: 170 },
    { label: '0%',  py: 200 },
  ];

  private dataPetro     = [32, 34, 31, 35, 38, 37, 40];
  private dataHernandez = [28, 27, 29, 26, 27, 26, 27];
  private dataFajardo   = [19, 20, 19, 20, 19, 20, 19];

  private toY(v: number) { return 200 - (v / 45) * 180; }
  private toPoints(data: number[]) {
    return data.map((v, i) => `${this.meses[i].x},${this.toY(v)}`).join(' ');
  }
  private toPuntos(data: number[]) {
    return data.map((v, i) => ({ x: this.meses[i].x, y: this.toY(v) }));
  }

  get lineaPetro()     { return this.toPoints(this.dataPetro);     }
  get lineaHernandez() { return this.toPoints(this.dataHernandez); }
  get lineaFajardo()   { return this.toPoints(this.dataFajardo);   }
  get puntosPetro()    { return this.toPuntos(this.dataPetro);     }
  get puntosHernandez(){ return this.toPuntos(this.dataHernandez); }
  get puntosFajardo()  { return this.toPuntos(this.dataFajardo);   }

  // ── Donut ───────────────────────────────────────────────
  intencionActual = [
    { nombre: 'Gustavo Petro',  pct: 40, colorClass: 'dot-green'  },
    { nombre: 'Rodolfo Hdez.',  pct: 27, colorClass: 'dot-blue'   },
    { nombre: 'Sergio Fajardo', pct: 19, colorClass: 'dot-purple' },
    { nombre: 'Otros',          pct: 14, colorClass: 'dot-gray'   },
  ];

  // ── Barras región ───────────────────────────────────────
  regionData = [
    { ciudad: 'Bogotá',      pct: 47 },
    { ciudad: 'Medellín',    pct: 29 },
    { ciudad: 'Cali',        pct: 42 },
    { ciudad: 'Barranquilla',pct: 33 },
    { ciudad: 'Bucaramanga', pct: 27 },
    { ciudad: 'Caribe',      pct: 31 },
  ];

  // ── Encuestas recientes ─────────────────────────────────
  encuestasRecientes = [
    { firma: 'CNC – Centro Nacional', fecha: '2026-05-10', muestra: 1200, margen: '±2.8%', confianza: 95, estado: 'Validada'   },
    { firma: 'Datexco',               fecha: '2026-05-08', muestra: 1500, margen: '±2.5%', confianza: 95, estado: 'Validada'   },
    { firma: 'Invamer',               fecha: '2026-05-05', muestra: 1100, margen: '±3.0%', confianza: 90, estado: 'En revisión'},
    { firma: 'Guarumo – EcoAnalítica',fecha: '2026-05-03', muestra: 900,  margen: '±3.3%', confianza: 90, estado: 'Validada'   },
    { firma: 'Cifras & Conceptos',    fecha: '2026-04-28', muestra: 1050, margen: '±3.1%', confianza: 95, estado: 'En revisión'},
  ];

  // ── Tareas ──────────────────────────────────────────────
  tareas = [
    { icon: '⏱', iconClass: 'icon-red',    texto: 'Validar encuesta Invamer del 05/05',  prioridad: 'ALTA',  prioClass: 'prio-alta'  },
    { icon: '🔮', iconClass: 'icon-red',    texto: 'Actualizar proyección 2da vuelta',    prioridad: 'ALTA',  prioClass: 'prio-alta'  },
    { icon: '📄', iconClass: 'icon-orange', texto: 'Revisar datos Cifras & Conceptos',    prioridad: 'MEDIA', prioClass: 'prio-media' },
    { icon: '📄', iconClass: 'icon-orange', texto: 'Generar reporte semanal para dirección',prioridad:'MEDIA',prioClass: 'prio-media' },
    { icon: '📍', iconClass: 'icon-gray',   texto: 'Completar análisis regional Caribe',  prioridad: 'BAJA',  prioClass: 'prio-baja'  },
  ];
}