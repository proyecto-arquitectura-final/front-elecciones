import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuditEvent } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly apiUrl = `${environment.apiUrl}/auditoria`;
  constructor(private readonly http: HttpClient) {}
  listar(): Observable<AuditEvent[]> { return this.http.get<ApiResponse<AuditEvent[]>>(this.apiUrl).pipe(map(r => r.data)); }
}
