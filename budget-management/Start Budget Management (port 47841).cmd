@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\launch.ps1" -Port 47841
if errorlevel 1 pause
