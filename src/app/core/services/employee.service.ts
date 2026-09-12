import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Employee } from '../models/employee.model';
import { PageResponse } from '../models/page-response.model';
import { ApiConfigService } from './api-config.service';

export interface EmployeeQuery {
  page: number;
  size: number;
  sort: string;
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getEmployees(query: EmployeeQuery): Observable<PageResponse<Employee>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', Math.min(query.size, 100))
      .set('sort', query.sort);

    for (const [key, value] of Object.entries(query)) {
      if (key !== 'page' && key !== 'size' && key !== 'sort' && value) {
        params = params.set(key, value);
      }
    }

    return this.http.get<PageResponse<Employee>>(`${this.apiConfig.baseUrl}/api/employees`, {
      params
    });
  }
}