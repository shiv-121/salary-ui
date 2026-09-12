export interface Salary {
  id: number;
  employeeId: number;
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}