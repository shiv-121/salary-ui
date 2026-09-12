export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD', 'JPY'] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface Salary {
  id: number;
  employeeId: number;
  amount: number;
  currency: Currency;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryRequest {
  amount: number;
  currency: Currency;
  effectiveFrom: string;
}