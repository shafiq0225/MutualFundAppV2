# MutualFundNav Monitor — Angular UI

Module-based Angular 16 monitoring dashboard for the MutualFundNav .NET 8 microservice.

## Setup

```bash
npm install
ng serve
```

Opens at http://localhost:4200

## Configuration

Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:63944'   // point at your API
};
```

For the second laptop or ngrok URL:
```typescript
apiBaseUrl: 'https://abc123.ngrok-free.app'
```

## Backend prerequisite

The NAV History and Kafka Events tabs require one new backend endpoint:
  GET /api/nav/history

See `NavFileSummaryRepository.cs` in the backend update files for the implementation.
Both tabs show a clear error message with fix instructions if the endpoint is missing.

## Build for production

```bash
ng build --configuration=production
```
Output goes to `dist/mutual-fund-nav-ui/` — copy to any static host or serve with `http-server`.
