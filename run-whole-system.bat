@echo off
setlocal

set "ROOT=%~dp0"

echo ==========================================
echo   Aquenta Whole System Launcher
echo ==========================================
echo.

where dotnet >nul 2>&1
if errorlevel 1 (
  echo [ERROR] dotnet CLI was not found in PATH.
  echo Install .NET SDK, then run this script again.
  pause
  exit /b 1
)

where npx.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npx was not found in PATH.
  echo Install Node.js, then run this script again.
  pause
  exit /b 1
)

echo [1/4] Starting backend API on http://localhost:5024 ...
if defined AQUENTA_SQL_CONNECTION (
  echo      Using AQUENTA_SQL_CONNECTION override.
) else (
  echo      Using auto SQL fallback: LocalDB ^> .\SQLEXPRESS ^> localhost\SQLEXPRESS
)
start "Aquenta Backend API" cmd /k "cd /d ""%ROOT%AquentaLibrary\AquentaAPI"" && dotnet run"

echo [2/4] Starting frontend server on http://localhost:5500 ...
start "Aquenta Frontend" cmd /k "cd /d ""%ROOT%"" && npx.cmd --yes http-server . -p 5500 -c-1"

echo [3/4] Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo [4/4] Opening browser tabs...
start "" "http://localhost:5500/index.html"
start "" "http://localhost:5024/swagger"

echo.
echo Done. If API errors mention SQL login/database issues:
echo  - Create AquentaDB on your SQL instance, or
echo  - Set AQUENTA_SQL_CONNECTION before running this script.
echo Example:
echo   set AQUENTA_SQL_CONNECTION=Server=.\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;TrustServerCertificate=True;
echo Keep both server windows open while using the system.
echo.
pause
