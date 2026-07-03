import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuditFilters, AuditManagement } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private readonly http: HttpClient) {}

  gestion(filters: AuditFilters): Observable<AuditManagement> {
    let params = new HttpParams()
      .set('search', filters.search?.trim() ?? '')
      .set('action', filters.action ?? '')
      .set('entity', filters.entity ?? '')
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);

    if (filters.success != null) {
      params = params.set('success', filters.success);
    }

    return this.http
      .get<ApiResponse<AuditManagement>>(`${this.apiUrl}/gestion`, { params })
      .pipe(map((response) => response.data));
  }
}
