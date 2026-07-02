import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Candidate } from '../models/candidate.model';

@Injectable({ providedIn: 'root' })
export class CandidatoService {
  private readonly apiUrl = `${environment.apiUrl}/candidatos`;
  constructor(private readonly http: HttpClient) {}
  listar(): Observable<Candidate[]> { return this.http.get<ApiResponse<Candidate[]>>(this.apiUrl).pipe(map(r => r.data)); }
  buscarPorId(id: number): Observable<Candidate> { return this.http.get<ApiResponse<Candidate>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data)); }
  crear(candidato: Candidate): Observable<Candidate> { return this.http.post<ApiResponse<Candidate>>(this.apiUrl, candidato).pipe(map(r => r.data)); }
  actualizar(id: number, candidato: Candidate): Observable<Candidate> { return this.http.put<ApiResponse<Candidate>>(`${this.apiUrl}/${id}`, candidato).pipe(map(r => r.data)); }
  eliminar(id: number): Observable<void> { return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data)); }
}
