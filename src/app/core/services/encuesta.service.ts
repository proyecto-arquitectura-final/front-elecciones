import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Poll } from '../models/poll.model';

@Injectable({ providedIn: 'root' })
export class EncuestaService {
  private readonly apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Poll[]> {
    return this.http.get<ApiResponse<Poll[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  crear(encuesta: Poll): Observable<Poll> {
    return this.http.post<ApiResponse<Poll>>(this.apiUrl, encuesta).pipe(map(r => r.data));
  }

  actualizar(id: number, encuesta: Poll): Observable<Poll> {
    return this.http.put<ApiResponse<Poll>>(`${this.apiUrl}/${id}`, encuesta).pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  importarCsv(file: File): Observable<number> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/import-csv`, formData).pipe(map(r => r.data));
  }
}
