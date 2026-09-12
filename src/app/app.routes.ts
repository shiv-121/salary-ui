import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard'
	},
	{
		path: 'dashboard',
		title: 'Dashboard | ACME Salary Management',
		loadComponent: () =>
			import('./features/dashboard/dashboard').then((module) => module.Dashboard)
	},
	{
		path: 'employees',
		children: [
			{
				path: 'new',
				title: 'Add Employee | ACME Salary Management',
				loadComponent: () =>
					import('./features/employees/employee-form/employee-form').then(
						(module) => module.EmployeeForm
					)
			},
			{
				path: ':id/salaries/new',
				title: 'Add Salary | ACME Salary Management',
				loadComponent: () =>
					import('./features/salary/salary-form/salary-form').then(
						(module) => module.SalaryForm
					)
			},
			{
				path: ':id',
				title: 'Employee Details | ACME Salary Management',
				loadComponent: () =>
					import('./features/employees/employee-details/employee-details').then(
						(module) => module.EmployeeDetails
					)
			},
			{
				path: '',
				title: 'Employees | ACME Salary Management',
				loadComponent: () =>
					import('./features/employees/employee-list/employee-list').then(
						(module) => module.EmployeeList
					)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'dashboard'
	}
];
