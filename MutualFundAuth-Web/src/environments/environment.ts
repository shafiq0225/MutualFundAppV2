// Routed through MutualFund.Gateway (Ocelot) instead of AuthAPI directly.
export const environment = {
  production: false,
  authApiUrl: 'https://localhost:7000'
};
