# Run from the MutualFundAppV2 repo root.
# Launches Gateway + all 4 backend services, each in its own PowerShell window.

$root = $PSScriptRoot

$services = @(
    @{ Name = "Gateway";        Path = "MutualFund.Gateway\MutualFund.Gateway";             Port = 7000 },
    @{ Name = "Investment.API"; Path = "MutualFund.Investment\MutualFund.Investment.API";   Port = 7003 },
    @{ Name = "SchemeAPI";      Path = "MutualFund.SchemeAPI\MutualFund.Scheme.API";         Port = 63946 },
    @{ Name = "AuthAPI";        Path = "MutualFund.AuthAPI\MutualFund.Auth.API";             Port = 7001 },
    @{ Name = "MutualFundNav";  Path = "MutualFundNav\MutualFundNav.API";                    Port = 63944 }
)

foreach ($svc in $services) {
    $fullPath = Join-Path $root $svc.Path
    Write-Host "Starting $($svc.Name) on port $($svc.Port) ..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd '$fullPath'; dotnet run") -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "All services launching:" -ForegroundColor Green
Write-Host "  Gateway        -> https://localhost:7000  (front door - use this from the Angular apps)"
Write-Host "  Investment.API -> https://localhost:7003/swagger"
Write-Host "  SchemeAPI      -> https://localhost:63946/swagger"
Write-Host "  AuthAPI        -> https://localhost:7001/swagger"
Write-Host "  MutualFundNav  -> https://localhost:63944"
Write-Host ""
Write-Host "Give everything 15-20 seconds to finish booting before testing from Angular." -ForegroundColor Yellow
