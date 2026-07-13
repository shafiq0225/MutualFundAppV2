FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MutualFund.Auth.API/MutualFund.Auth.API.csproj", "MutualFund.Auth.API/"]
COPY ["MutualFund.Auth.Application/MutualFund.Auth.Application.csproj", "MutualFund.Auth.Application/"]
COPY ["MutualFund.Auth.Domain/MutualFund.Auth.Domain.csproj", "MutualFund.Auth.Domain/"]
COPY ["MutualFund.Auth.Infrastructure/MutualFund.Auth.Infrastructure.csproj", "MutualFund.Auth.Infrastructure/"]
RUN dotnet restore "MutualFund.Auth.API/MutualFund.Auth.API.csproj"

# Copy full sources and build
COPY . .
RUN dotnet publish "MutualFund.Auth.API/MutualFund.Auth.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Setup runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configure Hugging Face port requirements
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
EXPOSE 7860

ENTRYPOINT ["dotnet", "MutualFund.Auth.API.dll"]
