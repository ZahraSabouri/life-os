@echo off
cd /d "%~dp0"
echo Life OS must be running. This copies Budget browser data into Life OS; nothing is deleted.
node scripts\transfer-budget-browser-data.mjs
pause
