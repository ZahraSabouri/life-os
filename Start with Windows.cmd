@echo off
rem Life OS will start when you sign in to Windows.
cd /d "%~dp0"
node launch.mjs --start-with-windows on
pause
