FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/OpsFlow/OpsFlow.Api.csproj ./OpsFlow.Api.csproj
RUN dotnet restore ./OpsFlow.Api.csproj

COPY src/OpsFlow/ ./OpsFlow/
RUN dotnet build ./OpsFlow.Api.csproj -c Release -o /app/build

FROM build AS publish
RUN dotnet publish ./OpsFlow.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "OpsFlow.Api.dll"]