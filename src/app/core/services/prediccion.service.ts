import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PredictionItem } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class PrediccionService {
  private readonly apiUrl = `${environment.apiUrl}/predicciones`;
  constructor(private readonly http: HttpClient) {}
  porEncuestas(): Observable<PredictionItem[]> { return this.http.get<ApiResponse<PredictionItem[]>>(`${this.apiUrl}/encuestas`).pipe(map(r => r.data)); }
  porResultadosParciales(): Observable<PredictionItem[]> { return this.http.get<ApiResponse<PredictionItem[]>>(`${this.apiUrl}/resultados-parciales`).pipe(map(r => r.data)); }
}
