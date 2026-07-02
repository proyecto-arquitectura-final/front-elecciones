import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Election } from '../models/election.model';

@Injectable({ providedIn: 'root' })
export class EleccionService {
  private readonly apiUrl = `${environment.apiUrl}/elecciones`;
  constructor(private readonly http: HttpClient) {}
  listar(): Observable<Election[]> { return this.http.get<ApiResponse<Election[]>>(this.apiUrl).pipe(map(r => r.data)); }
  buscarPorId(id: number): Observable<Election> { return this.http.get<ApiResponse<Election>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data)); }
  crear(eleccion: Election): Observable<Election> { return this.http.post<ApiResponse<Election>>(this.apiUrl, eleccion).pipe(map(r => r.data)); }
  actualizar(id: number, eleccion: Election): Observable<Election> { return this.http.put<ApiResponse<Election>>(`${this.apiUrl}/${id}`, eleccion).pipe(map(r => r.data)); }
  eliminar(id: number): Observable<void> { return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data)); }
}
