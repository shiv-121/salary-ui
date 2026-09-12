import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap
} from 'rxjs';

import { Employee } from '../../../core/models/employee.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { EmployeeQuery, EmployeeService } from '../../../core/services/employee.service';

type EmployeeSortField = 'employeeCode' | 'name' | 'email' | 'country' | 'department' | 'jobTitle';

interface EmployeeFilterControls {
  search: FormControl<string>;
  country: FormControl<string>;
  department: FormControl<string>;
  jobTitle: FormControl<string>;
}

const SORTABLE_FIELDS: readonly EmployeeSortField[] = [
  'employeeCode',
  'name',
  'email',
  'country',
  'department',
  'jobTitle'
];

@Component({
  selector: 'app-employee-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss'
})
export class EmployeeList {
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestSubject = new Subject<void>();

  readonly filters = new FormGroup<EmployeeFilterControls>({
    search: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true }),
    department: new FormControl('', { nonNullable: true }),
    jobTitle: new FormControl('', { nonNullable: true })
  });
  readonly displayedColumns = [
    'employeeCode',
    'name',
    'email',
    'country',
    'department',
    'jobTitle',
    'actions'
  ];
  readonly employees = signal<Employee[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly sortField = signal<EmployeeSortField>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.requestSubject
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.error.set(null);

          return this.employeeService.getEmployees(this.buildQuery()).pipe(
            catchError(() => {
              this.error.set('Unable to load employees. Please check the backend connection and try again.');
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response: PageResponse<Employee> | null) => {
        if (response) {
          this.employees.set(response.content);
          this.totalElements.set(response.totalElements);
        }
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.filters.patchValue(
          {
            search: params.get('search') ?? '',
            country: params.get('country') ?? '',
            department: params.get('department') ?? '',
            jobTitle: params.get('jobTitle') ?? ''
          },
          { emitEvent: false }
        );
        this.pageIndex.set(this.parsePage(params.get('page')));
        this.pageSize.set(this.parsePageSize(params.get('size')));
        this.setSortFromQuery(params.get('sort'));
        this.requestSubject.next();
      });

    this.filters.valueChanges
      .pipe(
        debounceTime(350),
        map(() => this.filters.getRawValue()),
        distinctUntilChanged(
          (previous, current) =>
            previous.search === current.search &&
            previous.country === current.country &&
            previous.department === current.department &&
            previous.jobTitle === current.jobTitle
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        void this.updateUrl();
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(Math.min(event.pageSize, 100));
    void this.updateUrl();
  }

  onSortChange(event: Sort): void {
    const field = SORTABLE_FIELDS.includes(event.active as EmployeeSortField)
      ? (event.active as EmployeeSortField)
      : 'name';
    const direction = event.direction === 'desc' ? 'desc' : 'asc';

    this.sortField.set(field);
    this.sortDirection.set(direction);
    this.pageIndex.set(0);
    void this.updateUrl();
  }

  retry(): void {
    this.requestSubject.next();
  }

  clearFilters(): void {
    this.filters.reset();
  }

  private buildQuery(): EmployeeQuery {
    const filterValues = this.filters.getRawValue();

    return {
      page: this.pageIndex(),
      size: Math.min(this.pageSize(), 100),
      sort: `${this.sortField()},${this.sortDirection()}`,
      search: filterValues.search.trim(),
      country: filterValues.country.trim(),
      department: filterValues.department.trim(),
      jobTitle: filterValues.jobTitle.trim()
    };
  }

  private async updateUrl(): Promise<void> {
    const values = this.filters.getRawValue();
    const queryParams: Record<string, string | number> = {
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: `${this.sortField()},${this.sortDirection()}`
    };

    for (const [key, value] of Object.entries(values)) {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        queryParams[key] = trimmedValue;
      }
    }

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private parsePage(value: string | null): number {
    const page = Number(value);
    return Number.isInteger(page) && page >= 0 ? page : 0;
  }

  private parsePageSize(value: string | null): number {
    const size = Number(value);
    return [10, 20, 50, 100].includes(size) ? size : 20;
  }

  private setSortFromQuery(value: string | null): void {
    const [field, direction] = value?.split(',') ?? [];
    if (SORTABLE_FIELDS.includes(field as EmployeeSortField)) {
      this.sortField.set(field as EmployeeSortField);
    } else {
      this.sortField.set('name');
    }
    this.sortDirection.set(direction === 'desc' ? 'desc' : 'asc');
  }
}