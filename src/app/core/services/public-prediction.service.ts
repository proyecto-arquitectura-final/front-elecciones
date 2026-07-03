import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { PublicPredictionDashboard } from '../models/public-prediction.model';

@Injectable({ providedIn: 'root' })
export class PublicPredictionService {
  private readonly apiUrl = `${environment.apiUrl}/public/predictions`;

  constructor(private readonly http: HttpClient) {}

  obtener(electionId?: number): Observable<PublicPredictionDashboard> {
    const params = electionId === undefined
      ? undefined
      : new HttpParams().set('electionId', String(electionId));
    return this.http
      .get<ApiResponse<PublicPredictionDashboard>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }
}
