import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  Candidate,
  CandidateManagement,
  CandidateUpsertRequest,
} from '../models/candidate.model';

@Injectable({ providedIn: 'root' })
export class CandidatoService {
  private readonly apiUrl = `${environment.apiUrl}/candidatos`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Candidate[]> {
    return this.http
      .get<ApiResponse<Candidate[]>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  gestion(): Observable<CandidateManagement> {
    return this.http
      .get<ApiResponse<CandidateManagement>>(`${this.apiUrl}/gestion`)
      .pipe(map((response) => response.data));
  }

  buscarPorId(id: number): Observable<Candidate> {
    return this.http
      .get<ApiResponse<Candidate>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  crear(request: CandidateUpsertRequest): Observable<Candidate> {
    return this.http
      .post<ApiResponse<Candidate>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, request: CandidateUpsertRequest): Observable<Candidate> {
    return this.http
      .put<ApiResponse<Candidate>>(`${this.apiUrl}/${id}`, request)
      .pipe(map((response) => response.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }
}
