import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CreateEmployeeRequest } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

interface EmployeeFormControls {
  employeeCode: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  country: FormControl<string>;
  department: FormControl<string>;
  jobTitle: FormControl<string>;
}

const requiredTextValidators = [Validators.required, Validators.pattern(/\S/)];

@Component({
  selector: 'app-employee-form',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss'
})
export class EmployeeForm {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = new FormGroup<EmployeeFormControls>({
    employeeCode: new FormControl('', { nonNullable: true, validators: requiredTextValidators }),
    firstName: new FormControl('', { nonNullable: true, validators: requiredTextValidators }),
    lastName: new FormControl('', { nonNullable: true, validators: requiredTextValidators }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    country: new FormControl('', { nonNullable: true, validators: requiredTextValidators }),
    department: new FormControl('', { nonNullable: true, validators: requiredTextValidators }),
    jobTitle: new FormControl('', { nonNullable: true, validators: requiredTextValidators })
  });

  submit(): void {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    const request: CreateEmployeeRequest = {
      employeeCode: values.employeeCode.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      country: values.country.trim(),
      department: values.department.trim(),
      jobTitle: values.jobTitle.trim()
    };

    if (Object.values(request).some((value) => value.length === 0)) {
      this.submitError.set('Complete all required fields before submitting.');
      return;
    }

    this.submitting.set(true);
    this.employeeService
      .createEmployee(request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Employee added successfully.', 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          void this.router.navigate(['/employees']);
        },
        error: (error: unknown) => {
          this.submitError.set(this.getErrorMessage(error));
        }
      });
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to add employee. Please try again.';
    }

    if (error.status === 0) {
      return 'The backend is unavailable. Please check the connection and try again.';
    }
    if (error.status === 409) {
      return 'An employee with this code or email already exists.';
    }
    if (error.status === 400 || error.status === 422) {
      return 'The employee details were not accepted. Check the fields and try again.';
    }

    return 'Unable to add employee. Please review the form and try again.';
  }
}