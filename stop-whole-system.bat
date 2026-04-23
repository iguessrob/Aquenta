@echo off
setlocal

echo ==========================================
echo   Aquenta Whole System Stopper
echo ==========================================
echo.

call :KillPort 5024 "Backend API"
call :KillPort 5500 "Frontend Server"

echo.
echo Done.
pause
exit /b 0

:KillPort
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND=0"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  set "FOUND=1"
  echo Stopping %LABEL% on port %PORT% (PID %%P)...
  taskkill /PID %%P /F >nul 2>&1
)

if "%FOUND%"=="0" (
  echo %LABEL% is not running on port %PORT%.
)

exit /b 0
