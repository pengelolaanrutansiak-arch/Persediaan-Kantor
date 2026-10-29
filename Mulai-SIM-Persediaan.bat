@echo off
chcp 65001 >nul
title SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK (SERVER LOKAL REALTIME)
color 0B

echo ======================================================================
echo    SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
echo    Kementerian Imigrasi dan Pemasyarakatan R.I. - Kanwil Riau
echo    KODE UAKPB : 137.04.0900.692310.000.KD
echo ======================================================================
echo.
echo  [*] Memeriksa Engine Server Komputer...

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js terdeteksi. Menjalankan server berkecepatan tinggi...
    echo.
    node "%~dp0server.js"
) else (
    echo  [OK] Menjalankan Server Native Windows PowerShell (Tanpa Instalasi)...
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)

pause

