import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  LiveSummary,
  OfficialResult,
  OfficialResultRequest,
  ResultImportResponse,
  ResultManagement,
  ResultSummary,
  ResultSummaryRequest,
  ResultValidationResponse,
  ResultValidationStatus,
} from '../models/result.model';

export interface ResultManagementFilters {
  electionId?: number | null;
  status?: ResultValidationStatus | null;
  department?: string;
  municipality?: string;
  search?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ResultadoService {
  private readonly apiUrl = `${environment.apiUrl}/resultados`;

  constructor(private readonly http: HttpClient) {}

  listar(filters?: { electionId?: number; department?: string }): Observable<OfficialResult[]> {
    let params = new HttpParams();
    if (filters?.electionId) params = params.set('electionId', filters.electionId);
    if (filters?.department) params = params.set('department', filters.department);
    return this.http
      .get<ApiResponse<OfficialResult[]>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  gestion(filters: ResultManagementFilters): Observable<ResultManagement> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 10)
      .set('search', filters.search?.trim() ?? '')
      .set('department', filters.department?.trim() ?? '')
      .set('municipality', filters.municipality?.trim() ?? '');

    if (filters.electionId != null) params = params.set('electionId', filters.electionId);
    if (filters.status) params = params.set('status', filters.status);

    return this.http
      .get<ApiResponse<ResultManagement>>(`${this.apiUrl}/gestion`, { params })
      .pipe(map((response) => response.data));
  }

  obtener(id: number): Observable<OfficialResult> {
    return this.http
      .get<ApiResponse<OfficialResult>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  crear(request: OfficialResultRequest): Observable<OfficialResult> {
    return this.http
      .post<ApiResponse<OfficialResult>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, request: OfficialResultRequest): Observable<OfficialResult> {
    return this.http
      .put<ApiResponse<OfficialResult>>(`${this.apiUrl}/${id}`, request)
      .pipe(map((response) => response.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  guardarResumen(request: ResultSummaryRequest): Observable<ResultSummary> {
    return this.http
      .put<ApiResponse<ResultSummary>>(`${this.apiUrl}/resumen`, request)
      .pipe(map((response) => response.data));
  }

  validar(electionId: number): Observable<ResultValidationResponse> {
    const params = new HttpParams().set('electionId', electionId);
    return this.http
      .post<ApiResponse<ResultValidationResponse>>(`${this.apiUrl}/validar`, {}, { params })
      .pipe(map((response) => response.data));
  }

  importarCsv(file: File): Observable<ResultImportResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<ApiResponse<ResultImportResponse>>(`${this.apiUrl}/import-csv`, body)
      .pipe(map((response) => response.data));
  }

  live(): Observable<LiveSummary> {
    return this.http
      .get<ApiResponse<LiveSummary>>(`${this.apiUrl}/live`)
      .pipe(map((response) => response.data));
  }
}
