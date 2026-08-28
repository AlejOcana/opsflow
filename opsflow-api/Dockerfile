FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/OpsFlow.Api.csproj ./OpsFlow.Api.csproj
RUN dotnet restore ./OpsFlow.Api.csproj

COPY src/ ./src/
RUN dotnet build ./src/OpsFlow.Api.csproj -c Release -o /app/build

FROM build AS publish
RUN dotnet publish ./src/OpsFlow.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=publish /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "OpsFlow.Api.dll"]