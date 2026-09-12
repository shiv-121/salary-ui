import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CompensationBreakdown, CompensationSummary } from '../models/analytics.model';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getSummary(): Observable<CompensationSummary> {
    return this.http.get<CompensationSummary>(`${this.apiConfig.baseUrl}/api/analytics/summary`);
  }

  getByCountry(): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-country`);
  }

  getByDepartment(): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-department`);
  }

  getByJobTitle(): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-job-title`);
  }
}