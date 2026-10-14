@echo off
rem Life OS will no longer start by itself.
cd /d "%~dp0"
node launch.mjs --start-with-windows off
pause
