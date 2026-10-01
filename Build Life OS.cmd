@echo off
cd /d "%~dp0code\life-os\frontend"
call npm.cmd run build
if errorlevel 1 goto fail
cd /d "%~dp0summer-rescue-plan-app"
call npm.cmd run build -- --base=/apps/summer-rescue/
if errorlevel 1 goto fail
echo Life OS and Summer Rescue built successfully. Restart Life OS to use the builds.
exit /b 0
:fail
echo Build failed. The preserved original has not been changed.
pause
exit /b 1
