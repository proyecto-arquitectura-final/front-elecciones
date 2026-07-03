import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ReportFormat, ReportManagement } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private readonly http: HttpClient) {}

  gestion(electionId?: number | null): Observable<ReportManagement> {
    let params = new HttpParams();
    if (electionId != null) params = params.set('electionId', electionId);
    return this.http
      .get<ApiResponse<ReportManagement>>(`${this.apiUrl}/gestion`, { params })
      .pipe(map((response) => response.data));
  }

  descargarResultadosPorEleccion(
    electionId: number,
    format: ReportFormat,
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams()
      .set('electionId', electionId)
      .set('format', format.toLowerCase());
    return this.http.get(`${this.apiUrl}/resultados`, {
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }

  /** Compatibilidad con las pantallas de analista: usa la elección más reciente con resultados. */
  descargarResultados(format: 'pdf' | 'csv' | 'json'): void {
    const params = new HttpParams().set('format', format);
    this.http
      .get(`${this.apiUrl}/resultados`, { params, observe: 'response', responseType: 'blob' })
      .subscribe({
        next: (response) => {
          if (!response.body) return;
          const header = response.headers.get('content-disposition') ?? '';
          const match = /filename="?([^";]+)"?/i.exec(header);
          const filename = match?.[1] ?? `resultados.${format}`;
          const url = URL.createObjectURL(response.body);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(url);
        },
      });
  }
}
