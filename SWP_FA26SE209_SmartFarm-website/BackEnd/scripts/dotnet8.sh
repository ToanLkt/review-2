#!/usr/bin/env bash
# Wrapper chạy .NET 8 SDK (cài qua Homebrew dotnet@8) cho project net8.0.
# Máy dev đang có .NET 10 SDK trên PATH nhưng thiếu runtime 8.0 để chạy test,
# nên dùng dotnet@8 tường minh. Dùng: ./scripts/dotnet8.sh build SmartFarm.sln
set -euo pipefail
export DOTNET_ROOT=/opt/homebrew/opt/dotnet@8/libexec
exec /opt/homebrew/opt/dotnet@8/bin/dotnet "$@"
