# ACME Employee Salary Management UI

Angular frontend for the ACME Employee Salary Management System. The application gives HR managers a focused workspace for employee records, salary history, and compensation analytics across a large employee population.

## Live Application

**Web UI:** [https://salary-ui.onrender.com](https://salary-ui.onrender.com/)

The production frontend is configured to use the deployed backend at:

```text
https://salary-management-6wdd.onrender.com
```

## Highlights

- Compensation Overview dashboard with real backend analytics.
- Reporting currency selector for USD, EUR, GBP, INR, CAD, AUD, SGD, and JPY.
- Interactive country and department salary charts.
- Click-through analytics drill-down to server-side employee filters.
- Employee list with server-side search, filters, sorting, and pagination.
- Employee details with current salary and salary history.
- Create Employee workflow with validation and backend error handling.
- Add Salary workflow with Material date picker and salary lifecycle support.
- Responsive Angular Material shell for desktop, tablet, and mobile layouts.
- Environment-based backend configuration for local development and production.

## Technology

- Angular 22
- TypeScript with strict compiler settings
- Angular Material and CDK
- Reactive Forms
- RxJS
- Chart.js with `ng2-charts`
- Vitest through the Angular unit-test builder
- SCSS

## Requirements

- Node.js 24.x or a compatible current Node.js release.
- npm 11.x recommended.
- A running Spring Boot backend for local API-backed workflows.

The repository includes an `.nvmrc` file for the expected Node.js version.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200/).

The development build uses the local backend URL:

```text
http://localhost:8080
```

Start the Spring Boot backend separately when testing real API data locally.

## Environment Configuration

API access is centralized through `ApiConfigService`; feature services do not hardcode backend URLs.

| Build mode | Configuration | API base URL |
| --- | --- | --- |
| Development | `src/environments/environment.development.ts` | `http://localhost:8080` |
| Production | `src/environments/environment.ts` | `https://salary-management-6wdd.onrender.com` |

Angular replaces the production environment file with the development environment file for the development build and local `ng serve` workflow. Do not add backend URLs directly to feature components or services.

## Application Structure

```text
src/app/
├── core/
│   ├── models/
│   └── services/
├── features/
│   ├── dashboard/
│   ├── employees/
│   │   ├── employee-details/
│   │   ├── employee-form/
│   │   └── employee-list/
│   └── salary/
│       └── salary-form/
├── app.config.ts
├── app.routes.ts
└── app.ts
```

The application uses standalone components and lazy-loaded feature routes. API communication is kept in core services, while feature components manage presentation state and user interaction.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Compensation analytics overview |
| `/employees` | Employee list with server-side controls |
| `/employees/new` | Create an employee |
| `/employees/:id` | Employee profile and salary history |
| `/employees/:id/salaries/new` | Add a salary record |

## Employee List Behavior

The employee list is designed for approximately 10,000 employees without loading the complete dataset into the browser.

- Pagination is server-side with page sizes of 10, 20, 50, and 100.
- Search and filters are sent to the backend.
- Search input is debounced.
- Sorting is sent as `field,direction`, including the backend `name` sort field.
- Filter, pagination, and sort state is represented in URL query parameters.
- Dashboard drill-down links open the list with the selected country, department, or job title already applied.

Supported employee list query parameters include:

```text
search
country
department
jobTitle
page
size
sort
```

Example:

```text
/employees?country=India&department=Engineering
```

## Compensation Analytics

The dashboard consumes aggregated analytics from the backend rather than calculating compensation metrics in Angular.

Analytics resources:

```text
GET /api/analytics/summary?currency=USD
GET /api/analytics/by-country?currency=USD
GET /api/analytics/by-department?currency=USD
GET /api/analytics/by-job-title?currency=USD
```

The dashboard includes:

- Total employees.
- Average, median, highest, and lowest salary cards.
- Interactive average salary charts by country and department.
- Compact job-title compensation table.
- Currency-aware salary formatting based on the backend response.
- Loading, empty, retry, and independent error states.

Currency conversion and aggregation remain backend responsibilities. The frontend does not calculate or invent exchange rates.

## Available Commands

Start development server:

```bash
npm start
```

Build the production application:

```bash
npm run build
```

Run the unit tests:

```bash
npm test
```

Run a development build with source maps:

```bash
npm run watch
```

The production build output is generated in:

```text
dist/salary-ui
```

## Deployment

The frontend is deployed on Render as a static web application.

Live URL:

[https://salary-ui.onrender.com](https://salary-ui.onrender.com/)

A production deployment should:

1. Install dependencies with `npm install`.
2. Build with `npm run build`.
3. Publish the generated `dist/salary-ui/browser` directory when using the Angular application builder output.

The deployed frontend expects the production API configured in `src/environments/environment.ts`.

## Quality and Design Principles

- Keep API and domain logic in services.
- Prefer typed models and strict TypeScript.
- Use server-side pagination, filtering, sorting, and aggregation for large datasets.
- Keep components standalone and reasonably focused.
- Use Angular Material controls consistently.
- Provide accessible labels, keyboard-accessible drill-down interactions, and visible focus states.
- Avoid unnecessary state-management libraries and client-side duplication of backend business rules.

## Verification

Before submitting changes, run:

```bash
npm run build
npm test
```

For end-to-end verification, start the backend and frontend, then check dashboard analytics, currency changes, employee filtering, pagination, sorting, employee creation, employee details, and salary creation workflows against real API data.
