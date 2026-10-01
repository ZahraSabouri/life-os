@echo off
rem One-time copy of Budget Management into Life OS (source is only read).
robocopy "%USERPROFILE%\Documents\BudgetManagement" "%~dp0..\budget-management" /E /COPY:DAT /DCOPY:T /R:1 /W:1 /XD "%USERPROFILE%\Documents\BudgetManagement\_to_delete" /NP /NFL /NDL /LOG:"%~dp0..\migration\budget-copy.log"
if %ERRORLEVEL% GEQ 8 (echo Copy failed. See migration\budget-copy.log & pause & exit /b 1)
echo Copy finished.
