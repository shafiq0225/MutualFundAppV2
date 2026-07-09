export interface QuickReturnDto {
  label: string;
  returnPercent: number;
  returnAmount: number;
  isPositive: boolean;
  hasData: boolean;
  isPartialPeriod?: boolean;
  cagr?: number | null;
}

export interface MemberSummaryDto {
  userId: string;
  fullName: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  holdingsCount: number;
  dayBefore?: QuickReturnDto | null;
  yesterday?: QuickReturnDto | null;
  thisWeek?: QuickReturnDto | null;
  oneMonth?: QuickReturnDto | null;
  oneYear?: QuickReturnDto | null;
  threeYear?: QuickReturnDto | null;
  fiveYear?: QuickReturnDto | null;
}

export interface FamilyOverviewDto {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  members: MemberSummaryDto[];
}

export interface HoldingCardDto {
  schemeCode: string;
  schemeName: string;
  fundName: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  units: number;
  currentNAV: number;
  dayBefore?: QuickReturnDto | null;
  yesterday?: QuickReturnDto | null;
  thisWeek?: QuickReturnDto | null;
  oneMonth?: QuickReturnDto | null;
  sixMonth?: QuickReturnDto | null;
  oneYear?: QuickReturnDto | null;
  threeYear?: QuickReturnDto | null;
  fiveYear?: QuickReturnDto | null;
}

export interface MemberHoldingsDto {
  userId: string;
  fullName: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  holdings: HoldingCardDto[];
}
