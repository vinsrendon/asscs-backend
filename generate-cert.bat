@echo off
title Generate SSL Certificate

echo ========================================
echo       SSL Certificate Generator
echo ========================================
echo.

:: Create cert folder if it does not exist
if not exist "cert" (
    mkdir "cert"
    echo Created cert folder.
) else (
    echo Cert folder already exists.
)

:: Navigate to cert folder
cd /d "cert"

:: Get the machine's local IPv4 address
for /f "tokens=*" %%A in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "MACHINE_IP=%%A"

:: Display detected IP
echo.
echo Detected Machine IP: %MACHINE_IP%
echo.

:: Generate SSL certificate
mkcert localhost 127.0.0.1 %MACHINE_IP%

echo.
echo ========================================
echo Certificate generation complete!
echo mkcert localhost 127.0.0.1 %MACHINE_IP%
echo ========================================
echo.

pause