@echo off
setlocal
set "LIFE_OS_BUILD_ROOT=%~dp0"
cd /d "%LIFE_OS_BUILD_ROOT%code\life-os\frontend"
if errorlevel 1 goto fail
call npm.cmd run build
if errorlevel 1 goto fail
cd /d "%LIFE_OS_BUILD_ROOT%summer-rescue"
if errorlevel 1 goto fail
call npm.cmd run build -- --base=/apps/summer-rescue/
if errorlevel 1 goto fail
echo Life OS and the Study hub built successfully. Restart Life OS to use the builds.
exit /b 0
:fail
echo Build failed. The preserved original has not been changed.
pause
exit /b 1
