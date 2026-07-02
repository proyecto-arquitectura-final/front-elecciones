import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChatResponse } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  constructor(private readonly http: HttpClient) {}
  preguntar(question: string): Observable<ChatResponse> {
    return this.http.post<ApiResponse<ChatResponse>>(`${this.apiUrl}/ask`, { question }).pipe(map(r => r.data));
  }
}
