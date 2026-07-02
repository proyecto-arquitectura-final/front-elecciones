import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resultados-analista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados-analista.html',
  styleUrl: './resultados-analista.scss'
})
export class ResultadosAnalista {

  stats = [
    { label: 'Mesas Procesadas', value: 88245, sub: '89.5% del total',    pct: 89.5, icon: '✔', iconClass: 'icon-green',  valueClass: '',       fillClass: 'fill-green'  },
    { label: 'En Proceso',       value: 3824,  sub: 'Siendo validadas',   pct: 4,    icon: '⏱', iconClass: 'icon-blue',   valueClass: '',       fillClass: 'fill-blue'   },
    { label: 'Con Errores',      value: 245,   sub: 'Requieren revisión', pct: 0.3,  icon: '⚠', iconClass: 'icon-red',    valueClass: 'red',    fillClass: 'fill-red'    },
    { label: 'Pendientes',       value: 6286,  sub: 'Sin reportar',       pct: 6.4,  icon: '⏳', iconClass: 'icon-orange', valueClass: 'orange', fillClass: 'fill-orange' },
  ];

  mesas = [
    { mesa: 'Mesa #45782', departamento: 'Bogotá D.C.', municipio: 'Bogotá',   votos: 450, hora: '14:32', estado: 'Procesado',  validacion: 'Aprobado'  },
    { mesa: 'Mesa #45783', departamento: 'Bogotá D.C.', municipio: 'Bogotá',   votos: 478, hora: '14:35', estado: 'Procesado',  validacion: 'Aprobado'  },
    { mesa: 'Mesa #45784', departamento: 'Bogotá D.C.', municipio: 'Bogotá',   votos: 412, hora: '14:38', estado: 'Procesando', validacion: 'Pendiente' },
    { mesa: 'Mesa #23456', departamento: 'Antioquia',   municipio: 'Medellín', votos: 523, hora: '14:25', estado: 'Procesado',  validacion: 'Aprobado'  },
    { mesa: 'Mesa #23457', departamento: 'Antioquia',   municipio: 'Medellín', votos: 0,   hora: '14:40', estado: 'Error',      validacion: 'Rechazado' },
  ];

  cargaOpciones = [
    { icon: '⬆', iconClass: 'icon-blue',   titulo: 'Importar CSV',         sub: 'Cargar resultados desde archivo'  },
    { icon: '🔄', iconClass: 'icon-green',  titulo: 'API Registraduría',    sub: 'Sincronizar automáticamente'      },
    { icon: '⬇', iconClass: 'icon-purple', titulo: 'Exportar Consolidado', sub: 'Descargar todos los resultados'   },
  ];

  getEstadoClass(e: string) {
    if (e === 'Procesado')  return 'badge-procesado';
    if (e === 'Procesando') return 'badge-procesando';
    return 'badge-error';
  }

  getValidClass(v: string) {
    if (v === 'Aprobado')  return 'valid-green';
    if (v === 'Pendiente') return 'valid-orange';
    return 'valid-red';
  }
}
