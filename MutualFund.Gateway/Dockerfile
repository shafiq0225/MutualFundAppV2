FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MutualFund.Gateway/MutualFund.Gateway.csproj", "MutualFund.Gateway/"]
RUN dotnet restore "MutualFund.Gateway/MutualFund.Gateway.csproj"

# Copy full sources and build
COPY . .
RUN dotnet publish "MutualFund.Gateway/MutualFund.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Setup runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configure Hugging Face port requirements
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
EXPOSE 7860

ENTRYPOINT ["dotnet", "MutualFund.Gateway.dll"]
