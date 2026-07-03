import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  Poll,
  PollImportResponse,
  PollManagement,
  PollManagementQuery,
  PollUpsertRequest,
} from '../models/poll.model';

@Injectable({ providedIn: 'root' })
export class EncuestaService {
  private readonly apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Poll[]> {
    return this.http
      .get<ApiResponse<Poll[]>>(this.apiUrl)
      .pipe(map((response) => response.data ?? []));
  }

  gestion(query: PollManagementQuery = {}): Observable<PollManagement> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 10))
      .set('search', query.search?.trim() ?? '');

    if (query.electionId != null) {
      params = params.set('electionId', String(query.electionId));
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http
      .get<ApiResponse<PollManagement>>(`${this.apiUrl}/gestion`, { params })
      .pipe(map((response) => response.data));
  }

  crear(encuesta: PollUpsertRequest): Observable<Poll> {
    return this.http
      .post<ApiResponse<Poll>>(this.apiUrl, encuesta)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, encuesta: PollUpsertRequest): Observable<Poll> {
    return this.http
      .put<ApiResponse<Poll>>(`${this.apiUrl}/${id}`, encuesta)
      .pipe(map((response) => response.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  importarCsv(file: File): Observable<PollImportResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<ApiResponse<PollImportResponse>>(`${this.apiUrl}/import-csv`, formData)
      .pipe(map((response) => response.data));
  }
}
