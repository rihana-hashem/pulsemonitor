FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY PulseMonitor.Api/PulseMonitor.Api.csproj PulseMonitor.Api/
COPY PulseMonitor.Application/PulseMonitor.Application.csproj PulseMonitor.Application/
COPY PulseMonitor.Domain/PulseMonitor.Domain.csproj PulseMonitor.Domain/
COPY PulseMonitor.Infrastructure/PulseMonitor.Infrastructure.csproj PulseMonitor.Infrastructure/
RUN dotnet restore PulseMonitor.Api/PulseMonitor.Api.csproj
COPY . .
RUN dotnet publish PulseMonitor.Api/PulseMonitor.Api.csproj -c Release --no-restore -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /out .
RUN mkdir -p App_Data/reports logs && chown -R "$APP_UID" App_Data logs
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "PulseMonitor.Api.dll"]
