export interface Project {
  id: string;
  name: string;
  revenue: number; // Stored in USD
  clientName: string;
  createdAt: number;
}

export interface EmployeePay {
  id: string;
  projectId: string;
  employeeName: string;
  amount: number; // Stored in USD
  role: string;
  createdAt: number;
}

export type Language = 'en' | 'ku';
export type Currency = 'USD' | 'IQD';
