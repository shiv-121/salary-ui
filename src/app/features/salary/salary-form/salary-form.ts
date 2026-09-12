import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  CreateSalaryRequest,
  Currency,
  SUPPORTED_CURRENCIES
} from '../../../core/models/salary.model';
import { SalaryService } from '../../../core/services/salary.service';

interface SalaryFormControls {
  amount: FormControl<number | null>;
  currency: FormControl<Currency | null>;
  effectiveFrom: FormControl<Date | null>;
}

@Component({
  selector: 'app-salary-form',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './salary-form.html',
  styleUrl: './salary-form.scss'
})
export class SalaryForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly salaryService = inject(SalaryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly currencies = SUPPORTED_CURRENCIES;
  readonly employeeId = signal<number | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = new FormGroup<SalaryFormControls>({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currency: new FormControl<Currency | null>(null, Validators.required),
    effectiveFrom: new FormControl<Date | null>(null, Validators.required)
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.employeeId.set(Number.isInteger(id) && id > 0 ? id : null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    const employeeId = this.employeeId();
    if (this.form.invalid || employeeId === null) {
      if (employeeId === null) {
        this.submitError.set('The employee could not be identified.');
      }
      return;
    }

    const values = this.form.getRawValue();
    if (values.amount === null || values.currency === null || values.effectiveFrom === null) {
      return;
    }

    const request: CreateSalaryRequest = {
      amount: values.amount,
      currency: values.currency,
      effectiveFrom: this.toBackendDate(values.effectiveFrom)
    };

    this.submitting.set(true);
    this.salaryService
      .createSalary(employeeId, request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Salary added successfully.', 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          void this.router.navigate(['/employees', employeeId]);
        },
        error: (error: unknown) => {
          this.submitError.set(this.getErrorMessage(error));
        }
      });
  }

  private toBackendDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to add salary. Please try again.';
    }

    if (error.status === 0) {
      return 'The backend is unavailable. Please check the connection and try again.';
    }
    if (error.status === 404) {
      return 'The employee could not be found.';
    }
    if (error.status === 400 || error.status === 409) {
      return 'This salary could not be added. Check the amount and effective date, or choose a date that does not overlap an existing salary.';
    }

    return 'Unable to add salary. Please review the form and try again.';
  }
}