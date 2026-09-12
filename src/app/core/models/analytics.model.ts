export interface CompensationSummary {
  reportingCurrency: string;
  totalEmployees: number;
  averageSalary: number;
  medianSalary: number | null;
  highestSalary: number | null;
  lowestSalary: number | null;
}

export interface CompensationBreakdown {
  group: string;
  employeeCount: number;
  averageSalary: number;
  medianSalary: number | null;
}