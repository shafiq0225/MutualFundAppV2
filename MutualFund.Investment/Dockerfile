FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MutualFund.Investment.API/MutualFund.Investment.API.csproj", "MutualFund.Investment.API/"]
COPY ["MutualFund.Investment.Application/MutualFund.Investment.Application.csproj", "MutualFund.Investment.Application/"]
COPY ["MutualFund.Investment.Domain/MutualFund.Investment.Domain.csproj", "MutualFund.Investment.Domain/"]
COPY ["MutualFund.Investment.Infrastructure/MutualFund.Investment.Infrastructure.csproj", "MutualFund.Investment.Infrastructure/"]
RUN dotnet restore "MutualFund.Investment.API/MutualFund.Investment.API.csproj"

# Copy full sources and build
COPY . .
RUN dotnet publish "MutualFund.Investment.API/MutualFund.Investment.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Setup runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configure Hugging Face port requirements
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
EXPOSE 7860

ENTRYPOINT ["dotnet", "MutualFund.Investment.API.dll"]
