import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AppUser, UserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<AppUser[]> {
    return this.http.get<ApiResponse<AppUser[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  buscarPorId(id: number): Observable<AppUser> {
    return this.http.get<ApiResponse<AppUser>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  crear(usuario: UserRequest): Observable<AppUser> {
    return this.http.post<ApiResponse<AppUser>>(this.apiUrl, usuario).pipe(map(r => r.data));
  }

  actualizar(id: number, usuario: UserRequest): Observable<AppUser> {
    return this.http.put<ApiResponse<AppUser>>(`${this.apiUrl}/${id}`, usuario).pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }
}
