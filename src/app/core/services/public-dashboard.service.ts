import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { PublicDashboardData } from '../models/public-dashboard.model';

@Injectable({ providedIn: 'root' })
export class PublicDashboardService {
  private readonly apiUrl = '/api/v1/public/dashboard';

  constructor(private readonly http: HttpClient) {}

  obtener(electionId?: number): Observable<PublicDashboardData> {
    const params = electionId === undefined
      ? undefined
      : new HttpParams().set('electionId', String(electionId));

    return this.http
      .get<ApiResponse<PublicDashboardData>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  exportUrl(electionId?: number): string {
    return electionId === undefined
      ? `${this.apiUrl}/export.csv`
      : `${this.apiUrl}/export.csv?electionId=${encodeURIComponent(electionId)}`;
  }
}
