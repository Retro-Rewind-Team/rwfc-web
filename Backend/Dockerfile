FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore RetroRewindWebsite.csproj
COPY . .
RUN dotnet publish RetroRewindWebsite.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5092
ENTRYPOINT ["dotnet", "RetroRewindWebsite.dll"]
