import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, finalize, forkJoin, of, switchMap, takeUntil } from 'rxjs';

import { Employee } from '../../../core/models/employee.model';
import { Salary } from '../../../core/models/salary.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-details',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.scss'
})
export class EmployeeDetails {
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeDestroyed = new Subject<void>();

  readonly employee = signal<Employee | null>(null);
  readonly currentSalary = signal<Salary | null>(null);
  readonly salaryHistory = signal<Salary[]>([]);
  readonly employeeLoading = signal(true);
  readonly salaryLoading = signal(false);
  readonly employeeError = signal<string | null>(null);
  readonly salaryHistoryError = signal<string | null>(null);
  readonly currentSalaryError = signal<string | null>(null);
  readonly employeeId = signal<number | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.employeeId.set(Number.isInteger(id) && id > 0 ? id : null);
          this.resetState();

          if (!Number.isInteger(id) || id <= 0) {
            this.employeeError.set('Employee not found.');
            this.employeeLoading.set(false);
            return of(null);
          }

          return this.employeeService.getEmployee(id).pipe(
            catchError(() => {
              this.employeeError.set('Employee not found or unavailable.');
              return of(null);
            }),
            finalize(() => this.employeeLoading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        takeUntil(this.routeDestroyed)
      )
      .subscribe((employee) => {
        if (employee) {
          this.employee.set(employee);
          this.loadSalaries(employee.id);
        }
      });
  }

  private loadSalaries(employeeId: number): void {
    this.salaryLoading.set(true);
    this.salaryHistoryError.set(null);
    this.currentSalaryError.set(null);

    forkJoin({
      history: this.employeeService.getSalaryHistory(employeeId).pipe(
        catchError(() => {
          this.salaryHistoryError.set('Salary history is currently unavailable.');
          return of<Salary[]>([]);
        })
      ),
      current: this.employeeService.getCurrentSalary(employeeId).pipe(
        catchError(() => {
          this.currentSalaryError.set('Current salary is currently unavailable.');
          return of(null);
        })
      )
    })
      .pipe(
        finalize(() => this.salaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ history, current }) => {
        this.salaryHistory.set(
          [...history].sort(
            (first, second) =>
              new Date(second.effectiveFrom).getTime() - new Date(first.effectiveFrom).getTime()
          )
        );
        this.currentSalary.set(current);
      });
  }

  private resetState(): void {
    this.employee.set(null);
    this.currentSalary.set(null);
    this.salaryHistory.set([]);
    this.employeeError.set(null);
    this.salaryHistoryError.set(null);
    this.currentSalaryError.set(null);
    this.employeeLoading.set(true);
  }
}