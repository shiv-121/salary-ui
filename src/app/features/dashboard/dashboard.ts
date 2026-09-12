import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Subject, catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { CompensationBreakdown, CompensationSummary } from '../../core/models/analytics.model';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshSubject = new Subject<void>();

  readonly summary = signal<CompensationSummary | null>(null);
  readonly reportingCurrency = signal<string | null>(null);
  readonly countries = signal<CompensationBreakdown[]>([]);
  readonly departments = signal<CompensationBreakdown[]>([]);
  readonly jobTitles = signal<CompensationBreakdown[]>([]);
  readonly loading = signal(true);
  readonly summaryError = signal(false);
  readonly countryError = signal(false);
  readonly departmentError = signal(false);
  readonly jobTitleError = signal(false);
  readonly breakdownColumns = ['group', 'employeeCount', 'averageSalary', 'medianSalary'];

  ngOnInit(): void {
    this.refreshSubject
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.summaryError.set(false);
          this.countryError.set(false);
          this.departmentError.set(false);
          this.jobTitleError.set(false);

          return forkJoin({
            summary: this.analyticsService.getSummary().pipe(
              catchError(() => {
                this.summaryError.set(true);
                return of(null);
              })
            ),
            countries: this.analyticsService.getByCountry().pipe(
              catchError(() => {
                this.countryError.set(true);
                return of<CompensationBreakdown[]>([]);
              })
            ),
            departments: this.analyticsService.getByDepartment().pipe(
              catchError(() => {
                this.departmentError.set(true);
                return of<CompensationBreakdown[]>([]);
              })
            ),
            jobTitles: this.analyticsService.getByJobTitle().pipe(
              catchError(() => {
                this.jobTitleError.set(true);
                return of<CompensationBreakdown[]>([]);
              })
            )
          }).pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        this.summary.set(result.summary);
        this.reportingCurrency.set(result.summary?.reportingCurrency ?? null);
        this.countries.set(result.countries);
        this.departments.set(result.departments);
        this.jobTitles.set(result.jobTitles);
      });

    this.refreshSubject.next();
  }

  refresh(): void {
    this.refreshSubject.next();
  }

  formatSalary(value: number): string {
    const currency = this.reportingCurrency();
    if (!currency) {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}