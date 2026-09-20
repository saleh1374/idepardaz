FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore را با پروژهٔ API انجام می‌دهیم (ساختار تک‌پروژه)
COPY src/Besaz.Api/Besaz.Api.csproj src/Besaz.Api/
RUN dotnet restore src/Besaz.Api/Besaz.Api.csproj

COPY src/Besaz.Api/ src/Besaz.Api/
RUN dotnet publish src/Besaz.Api/Besaz.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Besaz.Api.dll"]