import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { CompensationBreakdown, CompensationSummary } from '../../core/models/analytics.model';
import { Currency, SUPPORTED_CURRENCIES } from '../../core/models/salary.model';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    BaseChartDirective,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshSubject = new Subject<void>();

  readonly summary = signal<CompensationSummary | null>(null);
  readonly reportingCurrency = signal<string | null>(null);
  readonly selectedReportingCurrency = signal<Currency>('USD');
  readonly currencies = SUPPORTED_CURRENCIES;
  readonly countries = signal<CompensationBreakdown[]>([]);
  readonly departments = signal<CompensationBreakdown[]>([]);
  readonly jobTitles = signal<CompensationBreakdown[]>([]);
  readonly loading = signal(true);
  readonly summaryError = signal(false);
  readonly countryError = signal(false);
  readonly departmentError = signal(false);
  readonly jobTitleError = signal(false);
  readonly breakdownColumns = ['group', 'employeeCount', 'averageSalary', 'medianSalary'];
  readonly countryChartData = computed<ChartData<'bar'>>(() => this.createChartData(this.countries()));
  readonly departmentChartData = computed<ChartData<'bar'>>(() => this.createChartData(this.departments()));
  readonly countryChartOptions = this.createBarChartOptions(() => this.countries());
  readonly departmentChartOptions = this.createBarChartOptions(() => this.departments());

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
            summary: this.analyticsService.getSummary(this.selectedReportingCurrency()).pipe(
              catchError(() => {
                this.summaryError.set(true);
                return of(null);
              })
            ),
            countries: this.analyticsService.getByCountry(this.selectedReportingCurrency()).pipe(
              catchError(() => {
                this.countryError.set(true);
                return of<CompensationBreakdown[]>([]);
              })
            ),
            departments: this.analyticsService.getByDepartment(this.selectedReportingCurrency()).pipe(
              catchError(() => {
                this.departmentError.set(true);
                return of<CompensationBreakdown[]>([]);
              })
            ),
            jobTitles: this.analyticsService.getByJobTitle(this.selectedReportingCurrency()).pipe(
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

  changeReportingCurrency(currency: Currency): void {
    this.selectedReportingCurrency.set(currency);
    this.refreshSubject.next();
  }

  goToEmployees(): void {
    void this.router.navigate(['/employees']);
  }

  goToFilteredEmployees(filter: 'country' | 'department' | 'jobTitle', value: string): void {
    void this.router.navigate(['/employees'], { queryParams: { [filter]: value } });
  }

  activateDrilldown(event: KeyboardEvent, filter: 'country' | 'department' | 'jobTitle', value: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.goToFilteredEmployees(filter, value);
    }
  }

  onCountryChartClick(elements: object[] | undefined): void {
    const index = (elements?.[0] as { index?: number } | undefined)?.index;
    if (index !== undefined) {
      const country = this.countries()[index]?.group;
      if (country) {
        this.goToFilteredEmployees('country', country);
      }
    }
  }

  onDepartmentChartClick(elements: object[] | undefined): void {
    const index = (elements?.[0] as { index?: number } | undefined)?.index;
    if (index !== undefined) {
      const department = this.departments()[index]?.group;
      if (department) {
        this.goToFilteredEmployees('department', department);
      }
    }
  }

  formatSalary(value: number, fractionDigits = 2): string {
    const currency = this.reportingCurrency();
    if (!currency) {
      return value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
  }

  private createChartData(items: CompensationBreakdown[]): ChartData<'bar'> {
    return {
      labels: items.map((item) => item.group),
      datasets: [
        {
          data: items.map((item) => item.averageSalary),
          backgroundColor: '#5b91ad',
          hoverBackgroundColor: '#79abc1',
          borderRadius: 4,
          barThickness: 20
        }
      ]
    };
  }

  private createBarChartOptions(items: () => CompensationBreakdown[]): ChartOptions<'bar'> {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Average salary: ${this.formatSalary(Number(context.raw))}`,
            afterBody: (contexts) => {
              const item = items()[contexts[0]?.dataIndex ?? -1];
              return item ? `Employees: ${item.employeeCount.toLocaleString()}` : '';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#e4ebee' },
          ticks: { callback: (value) => this.formatSalary(Number(value), 0) }
        },
        y: { grid: { display: false } }
      }
    };
  }
}