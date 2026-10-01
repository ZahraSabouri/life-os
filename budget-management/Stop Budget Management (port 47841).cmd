@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\launch.ps1" -Port 47841 -Stop
if errorlevel 1 pause
