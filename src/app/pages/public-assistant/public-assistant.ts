import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { PublicDashboardService } from '../../core/services/public-dashboard.service';
import { PublicElection } from '../../core/models/public-dashboard.model';
import { ChatHistoryMessage, ChatStatus } from '../../core/models/chat.model';
import { refreshView } from '../../core/utils/zoneless-view.util';

interface ChatMessage {
  type: 'bot' | 'user';
  text: string;
  time: string;
  messageId?: number;
  provider?: string;
  model?: string;
  fallback?: boolean;
  sources?: string[];
  disclaimer?: string;
  helpful?: boolean | null;
  copied?: boolean;
}

@Component({
  selector: 'app-public-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-assistant.html',
  styleUrl: './public-assistant.scss',
})
export class PublicAssistant implements OnInit {
  private static readonly SESSION_KEY = 'elecciones-public-assistant-session';
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('messagePanel') private messagePanel?: ElementRef<HTMLDivElement>;

  input = '';
  sending = false;
  loadingHistory = false;
  error = '';
  electionId?: number;
  elections: PublicElection[] = [];
  electionTitle = 'Sistema electoral';
  sessionId?: string;
  status?: ChatStatus;
  messages: ChatMessage[] = [];

  readonly quickActions = [
    {
      icon: '📊',
      label: '¿Quién va ganando?',
      description: 'Revisa el líder, los votos y el avance del conteo.',
      prompt: '¿Quién lidera los resultados actuales, con cuántos votos y qué porcentaje de mesas se ha procesado?',
    },
    {
      icon: '📈',
      label: 'Entender la proyección',
      description: 'Conoce qué podría pasar y qué tan segura es la estimación.',
      prompt: 'Explícame la predicción actual, su confianza, incertidumbre y la diferencia entre los dos primeros candidatos.',
    },
    {
      icon: '👥',
      label: 'Comparar candidatos',
      description: 'Contrasta resultados, encuestas y tendencias.',
      prompt: 'Compara los dos candidatos que van liderando usando resultados oficiales, encuestas y proyección.',
    },
    {
      icon: '▥',
      label: 'Ver las encuestas',
      description: 'Consulta muestras, márgenes y cambios recientes.',
      prompt: 'Resume las encuestas consideradas, su muestra, margen de error y cómo influyen en la predicción.',
    },
    {
      icon: '🗺️',
      label: 'Revisar por regiones',
      description: 'Explora dónde hay más información reportada.',
      prompt: '¿Qué cobertura territorial tienen los resultados y cuáles son las zonas con mayor información reportada?',
    },
    {
      icon: '🗳️',
      label: 'Consultar participación',
      description: 'Entiende cuántas personas han votado y cuántas mesas faltan.',
      prompt: 'Explícame la participación electoral, el potencial de votantes y la consistencia de los datos cargados.',
    },
  ];

  constructor(
    private readonly chatService: ChatService,
    private readonly dashboardService: PublicDashboardService,
  ) {}

  ngOnInit(): void {
    this.sessionId = localStorage.getItem(PublicAssistant.SESSION_KEY) || undefined;
    this.loadStatus();
    this.loadDashboard();
    if (this.sessionId) {
      this.loadHistory(this.sessionId);
    } else {
      this.addWelcomeMessage();
    }
  }

  send(text = this.input): void {
    const question = text.trim();
    if (!question || this.sending) return;

    this.messages.push({ type: 'user', text: question, time: this.time() });
    this.input = '';
    this.sending = true;
    this.error = '';
    this.scrollToBottom();

    this.chatService
      .preguntar(question, this.electionId, this.sessionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (response) => {
          this.sending = false;
          this.sessionId = response.sessionId || this.sessionId;
          if (this.sessionId) {
            localStorage.setItem(PublicAssistant.SESSION_KEY, this.sessionId);
          }
          this.messages.push({
            type: 'bot',
            text: response.answer,
            messageId: response.messageId,
            provider: response.provider,
            model: response.model,
            fallback: response.fallback,
            sources: this.cleanSources(response.sources),
            disclaimer: this.friendlyDisclaimer(response.disclaimer),
            time: this.time(response.generatedAt),
          });
          this.scrollToBottom();
        },
        error: (error) => {
          this.sending = false;
          this.error = 'No pudimos responder en este momento. Intenta nuevamente en unos segundos.';
          this.messages.push({
            type: 'bot',
            text: 'Estoy teniendo dificultades para responder ahora. Intenta nuevamente en unos segundos.',
            fallback: true,
            provider: 'ERROR',
            time: this.time(),
          });
          console.error(error);
          this.scrollToBottom();
        },
      });
  }

  changeElection(): void {
    const election = this.elections.find((item) => item.id === this.electionId);
    if (election) this.electionTitle = election.name;
    this.startNewConversation(false);
    this.messages.push({
      type: 'bot',
      text: `Listo. Ahora podemos conversar sobre ${this.electionTitle}. Pregúntame por resultados, encuestas, participación, regiones o proyecciones.`,
      time: this.time(),
    });
    this.scrollToBottom();
  }

  startNewConversation(showWelcome = true): void {
    const previousSession = this.sessionId;
    this.sessionId = undefined;
    localStorage.removeItem(PublicAssistant.SESSION_KEY);
    this.messages = [];
    this.error = '';

    if (previousSession) {
      this.chatService
        .eliminarSesion(previousSession)
        .pipe(refreshView(this.cdr))
        .subscribe({ error: (error) => console.warn('No fue posible cerrar la sesión anterior', error) });
    }
    if (showWelcome) this.addWelcomeMessage();
  }

  rate(message: ChatMessage, helpful: boolean): void {
    if (!this.sessionId || !message.messageId || message.helpful === helpful) return;
    this.chatService
      .calificar(this.sessionId, message.messageId, helpful)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (response) => {
          if (response.saved) message.helpful = helpful;
        },
        error: (error) => console.error(error),
      });
  }

  async copy(message: ChatMessage): Promise<void> {
    await navigator.clipboard.writeText(message.text);
    message.copied = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      message.copied = false;
      this.cdr.markForCheck();
    }, 1400);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private loadStatus(): void {
    this.chatService
      .estado()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (status) => (this.status = status),
        error: (error) => console.error(error),
      });
  }

  private loadDashboard(): void {
    this.dashboardService
      .obtener()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.elections = data.elections;
          if (!this.electionId) this.electionId = data.election?.id;
          const selected = this.elections.find((item) => item.id === this.electionId) || data.election;
          this.electionTitle = selected?.name || this.electionTitle;
        },
        error: (error) => console.error(error),
      });
  }

  private loadHistory(sessionId: string): void {
    this.loadingHistory = true;
    this.chatService
      .historial(sessionId)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (history) => {
          this.loadingHistory = false;
          if (history.electionId) this.electionId = history.electionId;
          this.messages = history.messages.map((message) => this.mapHistory(message));
          if (!this.messages.length) this.addWelcomeMessage();
          this.scrollToBottom();
        },
        error: () => {
          this.loadingHistory = false;
          localStorage.removeItem(PublicAssistant.SESSION_KEY);
          this.sessionId = undefined;
          this.addWelcomeMessage();
        },
      });
  }

  private mapHistory(message: ChatHistoryMessage): ChatMessage {
    return {
      type: message.role === 'USER' ? 'user' : 'bot',
      text: message.content,
      time: this.time(message.createdAt),
      messageId: message.id,
      provider: message.provider,
      model: message.model,
      fallback: message.fallback,
      helpful: message.helpful,
    };
  }

  private addWelcomeMessage(): void {
    this.messages.push({
      type: 'bot',
      text: '¡Hola! Puedo ayudarte a entender los resultados, las encuestas, la participación y las proyecciones de esta elección. Puedes escribir tu pregunta o elegir una de las opciones sugeridas.',
      time: this.time(),
    });
  }


  private cleanSources(sources?: string[]): string[] | undefined {
    if (!sources?.length) return undefined;

    const labels = sources
      .map((source) => this.friendlySource(source))
      .filter((source): source is string => Boolean(source));

    return [...new Set(labels)];
  }

  private friendlySource(source: string): string | undefined {
    const normalized = source.trim().toLowerCase();

    if (!normalized || normalized.includes('gemini') || normalized.includes('backend') || normalized.includes('postgres')) {
      return undefined;
    }
    if (normalized.includes('official') || normalized.includes('resultado')) return 'Resultados oficiales';
    if (normalized.includes('poll') || normalized.includes('encuesta')) return 'Encuestas registradas';
    if (normalized.includes('prediction') || normalized.includes('predic') || normalized.includes('proye')) return 'Proyecciones electorales';
    if (normalized.includes('territor') || normalized.includes('region')) return 'Información regional';
    if (normalized.includes('particip') || normalized.includes('mesa') || normalized.includes('summary')) return 'Participación y mesas';
    if (normalized.includes('candidate') || normalized.includes('candidat')) return 'Candidatos';
    if (normalized.includes('dashboard') || normalized.includes('electoral')) return 'Información electoral';

    return source;
  }

  private friendlyDisclaimer(disclaimer?: string): string | undefined {
    if (!disclaimer) return undefined;

    const normalized = disclaimer.toLowerCase();
    if (
      normalized.includes('gemini') ||
      normalized.includes('backend') ||
      normalized.includes('postgres') ||
      normalized.includes('modelo')
    ) {
      return 'Esta respuesta es informativa. Consulta las fuentes oficiales para confirmar los resultados definitivos.';
    }

    return disclaimer;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messagePanel?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }

  private time(value?: string): string {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
