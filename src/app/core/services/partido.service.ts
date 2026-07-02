import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Party } from '../models/party.model';

@Injectable({ providedIn: 'root' })
export class PartidoService {
  private readonly apiUrl = `${environment.apiUrl}/partidos`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Party[]> {
    return this.http.get<ApiResponse<Party[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  buscarPorId(id: number): Observable<Party> {
    return this.http.get<ApiResponse<Party>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  crear(partido: Party): Observable<Party> {
    return this.http.post<ApiResponse<Party>>(this.apiUrl, partido).pipe(map(r => r.data));
  }

  actualizar(id: number, partido: Party): Observable<Party> {
    return this.http.put<ApiResponse<Party>>(`${this.apiUrl}/${id}`, partido).pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }
}
