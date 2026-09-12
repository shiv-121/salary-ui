import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateSalaryRequest, Salary } from '../models/salary.model';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class SalaryService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  createSalary(employeeId: number, request: CreateSalaryRequest): Observable<Salary> {
    return this.http.post<Salary>(
      `${this.apiConfig.baseUrl}/api/employees/${employeeId}/salaries`,
      request
    );
  }
}