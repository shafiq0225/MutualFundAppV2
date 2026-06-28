# MutualFundNav — Second Laptop Deployment Guide

## Overview
This guide explains how to deploy the MutualFundNav application from your first laptop (development machine) to your second laptop on a local network.

Architecture:
- Laptop 1 (Development): SQL Server, MutualFundNav source, database host
- Laptop 2 (Remote): Published API, Windows Service, accessible from any device

---

## PART 1: PREREQUISITES & NETWORK SETUP

### 1.1 Check Network IPs

On Laptop 1:
\\\powershell
ipconfig
# Note IPv4 Address (e.g., 192.168.1.10)
\\\

On Laptop 2:
\\\powershell
ipconfig
# Note IPv4 Address (e.g., 192.168.1.15)
\\\

Verify connectivity:
\\\powershell
# From Laptop 2, run:
ping 192.168.1.10
# Should see "Reply from 192.168.1.10"
\\\

---

## PART 2: SQL SERVER CONFIGURATION

### 2.1 Enable TCP/IP on Laptop 1

1. Press Win + R ? type SQLServerManager16 (SQL Server 2022) or SQLServerManager15 (2019)
2. Go to SQL Server Network Configuration ? Protocols for MSSQLSERVER
3. Right-click TCP/IP ? Enable
4. Right-click TCP/IP ? Properties
5. Under IP Addresses tab, scroll to IPAll
6. Set TCP Port to 1433
7. Click OK
8. In SQL Server Services, right-click SQL Server (MSSQLSERVER) ? Restart

### 2.2 Allow SQL Server Port in Windows Firewall

On Laptop 1 (as Administrator):
\\\powershell
New-NetFirewallRule -DisplayName "SQL Server 1433" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 1433
\\\

### 2.3 Test Connection from Laptop 2

On Laptop 2:
\\\powershell
Test-NetConnection -ComputerName 192.168.1.10 -Port 1433
# Expected: "TcpTestSucceeded: True"
\\\

---

## PART 3: CREATE SQL SERVER APPLICATION USER

### 3.1 Create Login in SQL Server (On Laptop 1)

Open SQL Server Management Studio ? Connect to your SQL Server:

1. Expand Security ? Logins
2. Right-click ? New Login
3. Login name: MutualFundAppUser
4. Select SQL Server authentication
5. Password: MutualFund@2024 (choose your own secure password)
6. Uncheck "User must change password at next login"
7. Click OK

### 3.2 Grant Database Permissions

1. Expand Databases ? MutualFundDbV2
2. Right-click ? Properties ? Permissions
3. Click Search ? Select MutualFundAppUser
4. Grant these permissions: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER
5. Click OK

---

## PART 4: UPDATE CONNECTION STRINGS

### 4.1 Modify appsettings.json (On Laptop 1)

File location: C:\MutualFundAppV2\MutualFundNav\MutualFundNav.API\appsettings.json

Replace the ConnectionStrings section:

\\\json
"ConnectionStrings": {
  "DefaultConnection": "Server=192.168.1.10,1433;Database=MutualFundDbV2;User ID=MutualFundAppUser;Password=MutualFund@2024;TrustServerCertificate=True;"
}
\\\

### 4.2 Update Kafka Bootstrap Server

\\\json
"Kafka": {
  "BootstrapServers": "192.168.1.10:9092"
}
\\\

---

## PART 5: PUBLISH THE APPLICATION

### 5.1 Publish from Visual Studio (Easiest)

On Laptop 1:
1. Open C:\MutualFundAppV2\MutualFundNav\MutualFundNav.sln in Visual Studio 2022
2. Right-click MutualFundNav.API project ? Publish
3. Select Folder as target
4. Folder location: C:\Publish\MutualFundNav
5. Configuration: Release
6. Click Finish ? Publish

### 5.2 Publish via Command Line

On Laptop 1 PowerShell:
\\\powershell
cd C:\MutualFundAppV2\MutualFundNav\MutualFundNav.API
dotnet publish -c Release -o C:\Publish\MutualFundNav
\\\

### 5.3 Verify Published Files

\\\powershell
Get-ChildItem C:\Publish\MutualFundNav | Select-Object Name
\\\

---

## PART 6: TRANSFER FILES TO LAPTOP 2

### 6.1 Create Destination Folder on Laptop 2

PowerShell (as Administrator):
\\\powershell
New-Item -ItemType Directory -Path "C:\MutualFundNav" -Force
New-Item -ItemType Directory -Path "C:\MutualFundNav\Logs" -Force
icacls "C:\MutualFundNav" /grant:r Everyone:F
\\\

### 6.2 Transfer Files (3 Methods)

#### METHOD A: Network Share (Recommended)

On Laptop 1:
1. Right-click C:\Publish\MutualFundNav ? Share
2. Add Everyone ? Share

On Laptop 2 PowerShell:
\\\powershell
\ = "\\LAPTOP1-NAME\Publish$\MutualFundNav"
\ = "C:\MutualFundNav"
Copy-Item -Path "\\*" -Destination \ -Recurse -Force
Get-ChildItem \
\\\

#### METHOD B: USB Drive
1. Copy C:\Publish\MutualFundNav\* to USB
2. Insert USB in Laptop 2
3. Copy to C:\MutualFundNav\

#### METHOD C: Cloud (OneDrive/Google Drive)
1. Copy to cloud on Laptop 1
2. Download on Laptop 2

---

## PART 7: UPDATE CONFIGURATION ON LAPTOP 2

### 7.1 Modify appsettings.json

File: C:\MutualFundNav\appsettings.json

\\\json
"ConnectionStrings": {
  "DefaultConnection": "Server=192.168.1.10,1433;Database=MutualFundDbV2;User ID=MutualFundAppUser;Password=MutualFund@2024;TrustServerCertificate=True;"
},
"Kafka": {
  "BootstrapServers": "192.168.1.10:9092"
}
\\\

---

## PART 8: RUN THE API ON LAPTOP 2

### 8.1 Test Run (Manual)

On Laptop 2, PowerShell (as Administrator):
\\\powershell
cd C:\MutualFundNav
.\MutualFundNav.API.exe
\\\

### 8.2 Test the API Endpoint

\\\powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/nav/latest" -Method Get
\\\

---

## PART 9: INSTALL AS WINDOWS SERVICE

### 9.1 Download NSSM

1. Visit https://nssm.cc/download
2. Download and extract to C:\Tools\nssm\

### 9.2 Install Service

On Laptop 2 PowerShell (as Administrator):
\\\powershell
\ = "MutualFundNav"
\ = "C:\MutualFundNav\MutualFundNav.API.exe"
\ = "C:\MutualFundNav"

& "C:\Tools\nssm\win64\nssm.exe" install \ \
& "C:\Tools\nssm\win64\nssm.exe" set \ AppDirectory \
& "C:\Tools\nssm\win64\nssm.exe" set \ AppExit Default Restart

Start-Service -Name \
Get-Service -Name \
\\\

### 9.3 Manage Service

\\\powershell
Start-Service -Name "MutualFundNav"
Stop-Service -Name "MutualFundNav"
Restart-Service -Name "MutualFundNav"
Get-Service -Name "MutualFundNav"
\\\

---

## PART 10: CONFIGURE FIREWALL ON LAPTOP 2

PowerShell (as Administrator):
\\\powershell
New-NetFirewallRule -DisplayName "MutualFundNav API HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000
New-NetFirewallRule -DisplayName "MutualFundNav API HTTPS" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5001
\\\

---

## PART 11: DEPLOY ANGULAR UI

### 11.1 Build Angular App (On Laptop 1)

\\\powershell
cd C:\MutualFundAppV2\MutualFundNav-Web
npm install
npm run build
\\\

### 11.2 Update API Base URL

File: src/environments/environment.prod.ts

\\\	ypescript
export const environment = {
  production: true,
  apiBaseUrl: 'http://192.168.1.15:5000'
};
\\\

### 11.3 Deploy UI

On Laptop 2:
\\\powershell
npm install -g http-server
cd C:\MutualFundNav-Web\dist\mutual-fund-nav-ui
http-server -p 4200
# Access: http://192.168.1.15:4200
\\\

---

## PART 12: ACCESS FROM ANY DEVICE

### From Same Network:
- API: http://192.168.1.15:5000/api/nav/latest
- UI: http://192.168.1.15:4200
- Swagger: http://192.168.1.15:5000/swagger/index.html

### From Outside Network (ngrok):
\\\powershell
ngrok http 5000
# Update Angular apiBaseUrl with the ngrok URL
\\\

---

## TROUBLESHOOTING

### Cannot connect to SQL Server
\\\powershell
Test-NetConnection -ComputerName 192.168.1.10 -Port 1433
\\\

### API won't start
\\\powershell
cd C:\MutualFundNav
.\MutualFundNav.API.exe
\\\

### Windows Service won't start
\\\powershell
Get-EventLog -LogName Application -Source nssm -Newest 10
Get-Service -Name "MutualFundNav"
\\\

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| Laptop 1 IP | 192.168.1.10 |
| Laptop 2 IP | 192.168.1.15 |
| SQL Server Port | 1433 |
| API Port (HTTP) | 5000 |
| API Port (HTTPS) | 5001 |
| UI Port | 4200 |
| Published Folder | C:\Publish\MutualFundNav |
| Deployment Folder | C:\MutualFundNav |
| Service Name | MutualFundNav |

---

## VERIFICATION CHECKLIST

- [ ] SQL Server TCP/IP enabled on Laptop 1
- [ ] Port 1433 open in firewall on Laptop 1
- [ ] Application user created in SQL Server
- [ ] Connection string updated in appsettings.json
- [ ] Application published successfully
- [ ] Files transferred to Laptop 2
- [ ] appsettings.json updated with correct IPs
- [ ] API runs manually without errors
- [ ] Windows Service installed and running
- [ ] Ports 5000, 5001 open in firewall on Laptop 2
- [ ] API responds to requests from Laptop 1
- [ ] Angular UI deployed and accessible
- [ ] UI can reach API

---

**You now have a complete step-by-step guide for deploying MutualFundNav across two laptops!**
