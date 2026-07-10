// All three field names now point at the Gateway's single origin —
// MutualFund.Gateway (Ocelot) fronts Investment/Scheme/Auth APIs by path,
// so no service file changes were needed, only these URLs.
export const environment = {
  production: false,
  investmentApiUrl: 'https://localhost:7000',
  schemeApiUrl: 'https://localhost:7000',
  authApiUrl: 'https://localhost:7000'
};
