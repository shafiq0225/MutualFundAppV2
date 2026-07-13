FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MutualFund.Scheme.API/MutualFund.Scheme.API.csproj", "MutualFund.Scheme.API/"]
COPY ["MutualFund.Scheme.Application/MutualFund.Scheme.Application.csproj", "MutualFund.Scheme.Application/"]
COPY ["MutualFund.Scheme.Domain/MutualFund.Scheme.Domain.csproj", "MutualFund.Scheme.Domain/"]
COPY ["MutualFund.Scheme.Infrastructure/MutualFund.Scheme.Infrastructure.csproj", "MutualFund.Scheme.Infrastructure/"]
RUN dotnet restore "MutualFund.Scheme.API/MutualFund.Scheme.API.csproj"

# Copy full sources and build
COPY . .
RUN dotnet publish "MutualFund.Scheme.API/MutualFund.Scheme.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Setup runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configure Hugging Face port requirements
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
EXPOSE 7860

ENTRYPOINT ["dotnet", "MutualFund.Scheme.API.dll"]
