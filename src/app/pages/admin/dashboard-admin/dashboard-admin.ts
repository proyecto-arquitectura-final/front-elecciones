import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss'
})
export class DashboardAdmin {

  stats = [
    { label: 'Elecciones Activas',     value: '3',   sub: 'En proceso de conteo', icon: '🗳', iconClass: 'icon-blue'   },
    { label: 'Candidatos Registrados', value: '147', sub: 'Todos los niveles',     icon: '👥', iconClass: 'icon-green'  },
    { label: 'Encuestas Cargadas',     value: '28',  sub: 'Marzo 2026',            icon: '📈', iconClass: 'icon-purple' },
    { label: 'Reportes Generados',     value: '342', sub: 'Este mes',              icon: '📄', iconClass: 'icon-orange' },
  ];

  elecciones = [
    { nombre: 'Elecciones Presidenciales 2026', tipo: 'Presidencia', fecha: '23 Mar 2026', progreso: 91.2 },
    { nombre: 'Senado de la República',          tipo: 'Senado',      fecha: '23 Mar 2026', progreso: 89.5 },
    { nombre: 'Cámara de Representantes',        tipo: 'Cámara',      fecha: '23 Mar 2026', progreso: 87.3 },
  ];

  actividad = [
    { icon: '✔', colorClass: 'act-green',  titulo: 'Nuevo resultado procesado',  sub: 'Mesa 45782',               tiempo: 'Hace 2 min'   },
    { icon: '📋', colorClass: 'act-blue',  titulo: 'Encuesta agregada',           sub: 'Invamer - Mar 2026',       tiempo: 'Hace 15 min'  },
    { icon: '👤', colorClass: 'act-orange',titulo: 'Candidato actualizado',       sub: 'María Fernández',          tiempo: 'Hace 1 hora'  },
    { icon: '🔐', colorClass: 'act-blue',  titulo: 'Usuario conectado',           sub: 'admin@elecciones.gov.co',  tiempo: 'Hace 2 horas' },
  ];

  apiEstado = [
    { titulo: 'API Registraduría', status: 'Conectado',  sub: 'Última sincronización: hace 1 min', colorClass: 'api-green', iconClass: 'icon-green' },
    { titulo: 'Base de Datos',     status: 'Operativa',  sub: 'Latencia: 23ms',                    colorClass: 'api-green', iconClass: 'icon-green' },
    { titulo: 'Backup Automático', status: 'Programado', sub: 'Próximo: en 4 horas',               colorClass: 'api-blue',  iconClass: 'icon-blue'  },
  ];

  accionesRapidas = [
    { icon: '👤', label: 'Nuevo Candidato',  ruta: '/admin/candidatos' },
    { icon: '📈', label: 'Cargar Encuesta',  ruta: '/admin/encuestas'  },
    { icon: '📄', label: 'Generar Reporte',  ruta: '/admin/reportes'   },
    { icon: '🔄', label: 'Sincronizar Datos',ruta: '/admin/resultados' },
  ];
}