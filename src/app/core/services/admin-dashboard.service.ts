import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AdminDashboardData } from '../models/admin-dashboard.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<AdminDashboardData> {
    return this.http
      .get<ApiResponse<AdminDashboardData>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }
}
