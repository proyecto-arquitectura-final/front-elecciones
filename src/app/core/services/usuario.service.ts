import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AppUser, UserManagement, UserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  gestion(search = '', page = 0, size = 10): Observable<UserManagement> {
    const params = new HttpParams()
      .set('search', search.trim())
      .set('page', page)
      .set('size', size);
    return this.http
      .get<ApiResponse<UserManagement>>(`${this.apiUrl}/gestion`, { params })
      .pipe(map((response) => response.data));
  }

  buscarPorId(id: number): Observable<AppUser> {
    return this.http
      .get<ApiResponse<AppUser>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  crear(usuario: UserRequest): Observable<AppUser> {
    return this.http
      .post<ApiResponse<AppUser>>(this.apiUrl, usuario)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, usuario: UserRequest): Observable<AppUser> {
    return this.http
      .put<ApiResponse<AppUser>>(`${this.apiUrl}/${id}`, usuario)
      .pipe(map((response) => response.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
