FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY SmartFarm.sln ./
COPY SmartFarm.Api/SmartFarm.Api.csproj SmartFarm.Api/
COPY SmartFarm.Services/SmartFarm.Services.csproj SmartFarm.Services/
COPY SmartFarm.Repositories/SmartFarm.Repositories.csproj SmartFarm.Repositories/
RUN dotnet restore SmartFarm.Api/SmartFarm.Api.csproj
COPY . .
RUN dotnet publish SmartFarm.Api/SmartFarm.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SmartFarm.Api.dll"]
