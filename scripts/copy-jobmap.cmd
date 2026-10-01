@echo off
rem One-time copy of JobMap App into Life OS (source is only read).
robocopy "%USERPROFILE%\Documents\JobMap\Career Agent\JobMap App" "%~dp0..\jobmap" /E /COPY:DAT /DCOPY:T /R:1 /W:1 /NP /NFL /NDL /LOG:"%~dp0..\migration\jobmap-copy.log"
if %ERRORLEVEL% GEQ 8 (echo Copy failed. See migration\jobmap-copy.log & pause & exit /b 1)
echo Copy finished.
