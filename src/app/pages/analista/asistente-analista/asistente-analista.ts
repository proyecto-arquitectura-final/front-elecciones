import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-asistente-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistente-analista.html',
  styleUrl: './asistente-analista.scss',
})
export class AsistenteAnalista {
  private readonly cdr = inject(ChangeDetectorRef);
  inputMensaje = '';
  private sessionId?: string;
  escribiendo = false;
  mensajes: { tipo: 'bot' | 'user'; texto: string; hora: string }[] = [
    {
      tipo: 'bot',
      texto:
        '¡Hola! Soy el asistente electoral con Gemini. Respondo usando el contexto de resultados, encuestas y predicciones preparado por el backend. ¿En qué puedo ayudarte?',
      hora: this.hora(),
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
    'Consulta de encuestas',
    'Datos por región',
    'Estadísticas de participación',
    'Gemini con contexto electoral controlado',
  ];
  constructor(private readonly chatService: ChatService) {}
  enviarMensaje(texto: string) {
    if (!texto.trim()) return;
    const pregunta = texto.trim();
    this.mensajes.push({ tipo: 'user', texto: pregunta, hora: this.hora() });
    this.inputMensaje = '';
    this.escribiendo = true;
    this.chatService
      .preguntar(pregunta, undefined, this.sessionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (r) => {
          this.escribiendo = false;
          this.sessionId = r.sessionId || this.sessionId;
          const tools = r.toolsUsed?.length
            ? `\n\nHerramientas usadas: ${r.toolsUsed.join(', ')}`
            : '';
          this.mensajes.push({ tipo: 'bot', texto: r.answer + tools, hora: this.hora() });
        },
        error: (e) => {
          this.escribiendo = false;
          console.error(e);
          this.mensajes.push({
            tipo: 'bot',
            texto:
              'No pude consultar Gemini en este momento. El backend puede usar la respuesta de contingencia si el proveedor no está disponible.',
            hora: this.hora(),
          });
        },
      });
  }
  private hora(): string {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
