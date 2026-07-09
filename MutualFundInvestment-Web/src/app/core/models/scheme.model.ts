export interface SchemeEnrollmentDto {
  id: number;
  schemeCode: string;
  schemeName: string;
  fundName: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string | null;
}
