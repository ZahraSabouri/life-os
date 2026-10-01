@echo off
cd /d "%~dp0"
node launch.mjs --stop
if errorlevel 1 pause
