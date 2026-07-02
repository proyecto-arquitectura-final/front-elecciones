import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-dashboard-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard-public.html',
  styleUrl: './dashboard-public.scss',
})
export class DashboardPublic {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly datosDemostrativos = true;

  constructor(private readonly chatService: ChatService) {}

  // ── Navegación ──────────────────────────────────────────
  vistaActiva: 'resultados' | 'predicciones' | 'asistente' = 'resultados';

  setVista(vista: 'resultados' | 'predicciones' | 'asistente') {
    this.vistaActiva = vista;
  }

  // ── Filtros ─────────────────────────────────────────────
  tipoEleccion = 'presidencia';
  nivelTerritorial = 'nacional';

  // ── Candidatos ──────────────────────────────────────────
  candidatos = [
    {
      nombre: 'María Fernández',
      partido: 'Partido Liberal',
      votos: 4250000,
      pct: 38.5,
      tendencia: 'up',
      colorClass: 'blue',
    },
    {
      nombre: 'Carlos Rodríguez',
      partido: 'Centro Democrático',
      votos: 3890000,
      pct: 35.2,
      tendencia: 'down',
      colorClass: 'red',
    },
    {
      nombre: 'Ana López',
      partido: 'Pacto Histórico',
      votos: 1980000,
      pct: 17.9,
      tendencia: 'up',
      colorClass: 'green',
    },
    {
      nombre: 'Pedro Gómez',
      partido: 'Cambio Radical',
      votos: 920000,
      pct: 8.4,
      tendencia: 'flat',
      colorClass: 'orange',
    },
  ];

  // ── Departamentos ───────────────────────────────────────
  departamentos = [
    { nombre: 'Bogotá D.C.', procesado: 95, participacion: 68, lider: 'María Fernández' },
    { nombre: 'Antioquia', procesado: 92, participacion: 71, lider: 'Carlos Rodríguez' },
    { nombre: 'Valle del Cauca', procesado: 88, participacion: 65, lider: 'María Fernández' },
    { nombre: 'Atlántico', procesado: 90, participacion: 62, lider: 'Ana López' },
    { nombre: 'Santander', procesado: 85, participacion: 69, lider: 'Carlos Rodríguez' },
  ];

  // ── Proyecciones ────────────────────────────────────────
  proyecciones = [
    {
      nombre: 'María Fernández',
      actual: 38.5,
      proyectado: 39.2,
      probabilidad: 94.2,
      colorClass: 'blue',
    },
    {
      nombre: 'Carlos Rodríguez',
      actual: 35.2,
      proyectado: 34.8,
      probabilidad: 5.5,
      colorClass: 'red',
    },
    { nombre: 'Ana López', actual: 17.9, proyectado: 18.1, probabilidad: 0.2, colorClass: 'green' },
    {
      nombre: 'Pedro Gómez',
      actual: 8.4,
      proyectado: 7.9,
      probabilidad: 0.1,
      colorClass: 'orange',
    },
  ];

  // ── Metodología ─────────────────────────────────────────
  metodologia = [
    {
      icon: '🗃️',
      iconClass: 'blue',
      titulo: 'Datos Históricos',
      descripcion: 'Patrones de votación de elecciones anteriores (2018, 2022)',
    },
    {
      icon: '📊',
      iconClass: 'purple',
      titulo: 'Velocidad de Conteo',
      descripcion: 'Ajuste por diferencias en tiempo de reporte entre regiones',
    },
    {
      icon: '📈',
      iconClass: 'green',
      titulo: 'Comportamiento Regional',
      descripcion: 'Tendencias por departamento y concentración urbana/rural',
    },
    {
      icon: '↗️',
      iconClass: 'orange',
      titulo: 'Margen de Error',
      descripcion: '±1.8% considerando incertidumbre estadística',
    },
  ];

  // ── Encuestas Pre-Electorales ───────────────────────────
  encuestasAgregadas = [
    { nombre: 'María Fernández', cnc: 36.5, invamer: 39.0, yanhaas: 37.5 },
    { nombre: 'Carlos Rodríguez', cnc: 34.0, invamer: 33.5, yanhaas: 35.0 },
    { nombre: 'Ana López', cnc: 18.0, invamer: 19.0, yanhaas: 18.0 },
    { nombre: 'Pedro Gómez', cnc: 11.5, invamer: 10.0, yanhaas: 10.0 },
  ];

  promedioEncuestas = [
    { nombre: 'María Fernández', promedio: 37, colorClass: 'blue' },
    { nombre: 'Carlos Rodríguez', promedio: 34, colorClass: 'red' },
    { nombre: 'Ana López', promedio: 18.3, colorClass: 'green' },
    { nombre: 'Pedro Gómez', promedio: 10.7, colorClass: 'orange' },
  ];

  fuentesEncuestas = [
    {
      fuente: 'Centro Nacional de Consultoría',
      fecha: '15 Mar 2026',
      muestra: 2500,
      margen: '±2%',
      peso: '1x',
    },
    { fuente: 'Invamer', fecha: '18 Mar 2026', muestra: 3200, margen: '±1.8%', peso: '1.2x' },
    { fuente: 'YanHaas', fecha: '20 Mar 2026', muestra: 2800, margen: '±1.9%', peso: '1.1x' },
  ];

  // ── Tab predicciones ────────────────────────────────────
  tabPrediccion: 'vivo' | 'encuestas' = 'vivo';

  // ── Chat ────────────────────────────────────────────────
  inputMensaje = '';
  escribiendo = false;

  mensajes: { tipo: 'bot' | 'user'; texto: string; hora: string }[] = [
    {
      tipo: 'bot',
      texto:
        '¡Hola! Soy tu asistente electoral virtual. Puedo ayudarte a consultar resultados en tiempo real, ver predicciones, comparar candidatos y responder tus preguntas sobre las elecciones. ¿En qué puedo ayudarte?',
      hora: this.horaActual(),
    },
  ];

  accionesRapidas = [
    { icon: '📊', texto: 'Consultar resultados actuales' },
    { icon: '📈', texto: 'Ver predicciones' },
    { icon: '👥', texto: 'Comparar candidatos' },
    { icon: '⭐', texto: 'Resumen ejecutivo' },
  ];

  capacidades = [
    'Consulta de resultados en vivo',
    'Análisis de predicciones',
    'Comparación de candidatos',
    'Datos por región',
    'Estadísticas de participación',
    'Información histórica',
  ];

  enviarMensaje(texto: string) {
    if (!texto.trim() || this.escribiendo) return;

    const pregunta = texto.trim();
    this.mensajes.push({ tipo: 'user', texto: pregunta, hora: this.horaActual() });
    this.inputMensaje = '';
    this.escribiendo = true;

    this.chatService
      .preguntar(pregunta)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (response) => {
          this.escribiendo = false;
          const tools = response.toolsUsed?.length
            ? `\n\nHerramientas usadas: ${response.toolsUsed.join(', ')}`
            : '';
          this.mensajes.push({
            tipo: 'bot',
            texto: response.answer + tools,
            hora: this.horaActual(),
          });
        },
        error: (error) => {
          this.escribiendo = false;
          console.error(error);
          this.mensajes.push({
            tipo: 'bot',
            texto:
              'No pude consultar el asistente en este momento. Verifica que el backend esté disponible.',
            hora: this.horaActual(),
          });
        },
      });
  }

  private horaActual(): string {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
