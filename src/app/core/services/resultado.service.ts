import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { OfficialResult, LiveSummary } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class ResultadoService {
  private readonly apiUrl = `${environment.apiUrl}/resultados`;

  constructor(private readonly http: HttpClient) {}

  listar(filters?: { electionId?: number; department?: string }): Observable<OfficialResult[]> {
    let params = new HttpParams();
    if (filters?.electionId) params = params.set('electionId', filters.electionId);
    if (filters?.department) params = params.set('department', filters.department);
    return this.http.get<ApiResponse<OfficialResult[]>>(this.apiUrl, { params }).pipe(map(r => r.data));
  }

  crear(resultado: OfficialResult): Observable<OfficialResult> {
    return this.http.post<ApiResponse<OfficialResult>>(this.apiUrl, resultado).pipe(map(r => r.data));
  }

  live(): Observable<LiveSummary> {
    return this.http.get<ApiResponse<LiveSummary>>(`${this.apiUrl}/live`).pipe(map(r => r.data));
  }

  sincronizarRegistraduria(): Observable<number> {
    return this.http.post<ApiResponse<number>>(`${environment.apiUrl}/registraduria/sincronizar`, {}).pipe(map(r => r.data));
  }

  estadoRegistraduria(): Observable<string> {
    return this.http.get<ApiResponse<string>>(`${environment.apiUrl}/registraduria/estado`).pipe(map(r => r.data));
  }
}
