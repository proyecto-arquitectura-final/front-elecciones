import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Election, ElectionManagement } from '../models/election.model';

@Injectable({ providedIn: 'root' })
export class EleccionService {
  private readonly apiUrl = `${environment.apiUrl}/elecciones`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Election[]> {
    return this.http
      .get<ApiResponse<Election[]>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  gestion(): Observable<ElectionManagement> {
    return this.http
      .get<ApiResponse<ElectionManagement>>(`${this.apiUrl}/gestion`)
      .pipe(map((response) => response.data));
  }

  buscarPorId(id: number): Observable<Election> {
    return this.http
      .get<ApiResponse<Election>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  crear(eleccion: Election): Observable<Election> {
    return this.http
      .post<ApiResponse<Election>>(this.apiUrl, eleccion)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, eleccion: Election): Observable<Election> {
    return this.http
      .put<ApiResponse<Election>>(`${this.apiUrl}/${id}`, eleccion)
      .pipe(map((response) => response.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }
}
