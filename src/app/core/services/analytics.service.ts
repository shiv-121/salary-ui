import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CompensationBreakdown, CompensationSummary } from '../models/analytics.model';
import { Currency } from '../models/salary.model';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getSummary(currency?: Currency): Observable<CompensationSummary> {
    return this.http.get<CompensationSummary>(`${this.apiConfig.baseUrl}/api/analytics/summary`, {
      params: this.currencyParams(currency)
    });
  }

  getByCountry(currency?: Currency): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-country`, {
      params: this.currencyParams(currency)
    });
  }

  getByDepartment(currency?: Currency): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-department`, {
      params: this.currencyParams(currency)
    });
  }

  getByJobTitle(currency?: Currency): Observable<CompensationBreakdown[]> {
    return this.http.get<CompensationBreakdown[]>(`${this.apiConfig.baseUrl}/api/analytics/by-job-title`, {
      params: this.currencyParams(currency)
    });
  }

  private currencyParams(currency?: Currency): HttpParams {
    return currency ? new HttpParams().set('currency', currency) : new HttpParams();
  }
}