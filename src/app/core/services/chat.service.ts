import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ChatFeedbackResponse,
  ChatHistory,
  ChatResponse,
  ChatStatus,
} from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  constructor(private readonly http: HttpClient) {}

  preguntar(question: string, electionId?: number, sessionId?: string): Observable<ChatResponse> {
    return this.http
      .post<ApiResponse<ChatResponse>>(`${this.apiUrl}/ask`, { question, electionId, sessionId })
      .pipe(map((response) => response.data));
  }

  estado(): Observable<ChatStatus> {
    return this.http
      .get<ApiResponse<ChatStatus>>(`${this.apiUrl}/status`)
      .pipe(map((response) => response.data));
  }

  historial(sessionId: string): Observable<ChatHistory> {
    return this.http
      .get<ApiResponse<ChatHistory>>(`${this.apiUrl}/sessions/${sessionId}/messages`)
      .pipe(map((response) => response.data));
  }

  calificar(
    sessionId: string,
    messageId: number,
    helpful: boolean,
    comment?: string,
  ): Observable<ChatFeedbackResponse> {
    return this.http
      .patch<ApiResponse<ChatFeedbackResponse>>(`${this.apiUrl}/feedback`, {
        sessionId,
        messageId,
        helpful,
        comment,
      })
      .pipe(map((response) => response.data));
  }

  eliminarSesion(sessionId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/sessions/${sessionId}`)
      .pipe(map(() => undefined));
  }
}
