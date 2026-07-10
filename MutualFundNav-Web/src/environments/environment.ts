// Routed through MutualFund.Gateway (Ocelot) instead of MutualFundNav.API directly.
// All endpoints used here (nav/*, jobs/logs*, holidays/*, kafka/*) are public
// at the Gateway (no Bearer token required), so no auth changes needed.
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7000'
};
