@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul && python qa_release.py && pause && exit /b %errorlevel%
where py >nul 2>nul && py -3 qa_release.py && pause && exit /b %errorlevel%
echo Python 3 is required to run the QA script.
pause
exit /b 1
