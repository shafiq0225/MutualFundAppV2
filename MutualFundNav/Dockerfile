FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MutualFundNav.API/MutualFundNav.API.csproj", "MutualFundNav.API/"]
COPY ["MutualFundNav.Application/MutualFundNav.Application.csproj", "MutualFundNav.Application/"]
COPY ["MutualFundNav.Domain/MutualFundNav.Domain.csproj", "MutualFundNav.Domain/"]
COPY ["MutualFundNav.Infrastructure/MutualFundNav.Infrastructure.csproj", "MutualFundNav.Infrastructure/"]
RUN dotnet restore "MutualFundNav.API/MutualFundNav.API.csproj"

# Copy full sources and build
COPY . .
RUN dotnet publish "MutualFundNav.API/MutualFundNav.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Setup runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configure Hugging Face port requirements
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
EXPOSE 7860

ENTRYPOINT ["dotnet", "MutualFundNav.API.dll"]
