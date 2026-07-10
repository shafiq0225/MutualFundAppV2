export interface DecodedTokenClaims {
  sub: string;      // PAN / UserId
  role: string;
  firstName?: string;
  lastName?: string;
  exp: number;
}
