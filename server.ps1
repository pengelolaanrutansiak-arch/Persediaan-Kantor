<#
.SYNOPSIS
  SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
  Server Database Fisik Lokal & Real-Time Sync (PowerShell Native)
  Bekerja langsung di Windows tanpa memerlukan instalasi Node.js/software tambahan.
#>

param(
    [int]$Port = 3000
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = $PSScriptRoot
$publicDir = Join-Path $rootDir "public"
$dbDir = Join-Path $rootDir "database"
$backupDir = Join-Path $dbDir "backups"

if (-not (Test-Path $dbDir)) { New-Item -ItemType Directory -Path $dbDir -Force | Out-Null }
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }

$global:LastModified = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

function Get-LocalIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
            $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and 
            $_.IPAddress -notmatch '^(169\.254|127\.)' 
        } | Select-Object -First 1).IPAddress
        if ($ip) { return $ip }
    } catch {}
    return "localhost"
}

$localIp = Get-LocalIP

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

function Read-JsonDbFile($filename, $defaultObj) {
    $path = Join-Path $dbDir $filename
    if (Test-Path $path) {
        try {
            $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
            return ($raw | ConvertFrom-Json)
        } catch {}
    }
    return $defaultObj
}

function Write-JsonDbFile($filename, $data) {
    $path = Join-Path $dbDir $filename
    $tempPath = Join-Path $dbDir "$filename.tmp"
    try {
        $json = $data | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($tempPath, $json, [System.Text.Encoding]::UTF8)
        Move-Item -Path $tempPath -Destination $path -Force
        $global:LastModified = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        return $true
    } catch {
        if (Test-Path $tempPath) { Remove-Item $tempPath -Force -ErrorAction SilentlyContinue }
        return $false
    }
}

# Coba gunakan HttpListener terlebih dahulu
$useHttpListener = $false
try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    if ($localIp -ne "localhost") {
        try { $listener.Prefixes.Add("http://$($localIp):$Port/") } catch {}
    }
    $listener.Start()
    $useHttpListener = $true
} catch {
    $useHttpListener = $false
}

Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA" -ForegroundColor White
Write-Host "  SERVER DATABASE FISIK LOKAL & REAL-TIME BACA-TULIS (POWERSHELL)" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [+] Komputer Lokal (PC Admin) : http://localhost:$Port" -ForegroundColor Yellow
if ($localIp -ne "localhost") {
Write-Host "  [+] Jaringan WiFi Kantor (HP) : http://$($localIp):$Port" -ForegroundColor Yellow
Write-Host "  [+] Form Ambil Barang (QR)    : http://$($localIp):$Port/ambil-barang.html" -ForegroundColor Yellow
}
Write-Host "  [+] Folder Penyimpanan Fisik  : $dbDir" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Server sedang berjalan aktif. Jendela ini jangan ditutup." -ForegroundColor Gray
Write-Host "  Tekan Ctrl+C untuk menghentikan server." -ForegroundColor Gray
Write-Host ""

if ($useHttpListener) {
    # Mode 1: HttpListener (Standard Windows)
    function Send-HttpResponse($response, $data, [int]$statusCode = 200) {
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json; charset=utf-8"
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        $json = $data | ConvertTo-Json -Depth 10 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
    }

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            $rawUrl = $request.Url.AbsolutePath
            $method = $request.HttpMethod

            if ($method -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
                $response.Close()
                continue
            }

            if ($rawUrl -eq "/api/status" -and $method -eq "GET") {
                Send-HttpResponse $response @{
                    status = "online"
                    engine = "powershell_httplistener"
                    satker = "Rutan Kelas II B Siak Sri Indrapura"
                    kodeUakpb = "137.04.0900.692310.000.KD"
                    localIp = $localIp
                    port = $Port
                    storageDirectory = $dbDir
                    lastModified = $global:LastModified
                }
                continue
            }

            if ($rawUrl -eq "/api/sync-poll" -and $method -eq "GET") {
                $since = 0
                if ($request.QueryString["since"]) {
                    [long]::TryParse($request.QueryString["since"], [ref]$since) | Out-Null
                }
                $hasUpdate = ($global:LastModified -gt $since)
                Send-HttpResponse $response @{
                    hasUpdate = $hasUpdate
                    lastModified = $global:LastModified
                }
                continue
            }

            if ($rawUrl -eq "/api/data" -and $method -eq "GET") {
                $inv = Read-JsonDbFile "inventory.json" @()
                $trx = Read-JsonDbFile "transactions.json" @()
                $off = Read-JsonDbFile "officers.json" @()
                $usr = Read-JsonDbFile "users.json" @()
                $sat = Read-JsonDbFile "satker.json" @{}
                Send-HttpResponse $response @{
                    success = $true
                    data = @{
                        inventory = $inv
                        transactions = $trx
                        officers = $off
                        users = $usr
                        satker = $sat
                    }
                    lastModified = $global:LastModified
                }
                continue
            }

            $body = ""
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $body = $reader.ReadToEnd()
                $reader.Close()
            }

            if ($rawUrl -eq "/api/inventory" -and $method -eq "POST") {
                try {
                    $payload = $body | ConvertFrom-Json
                    $arr = if ($payload -is [System.Array]) { $payload } else { $payload.inventory }
                    if ($arr) {
                        Write-JsonDbFile "inventory.json" $arr | Out-Null
                        Send-HttpResponse $response @{ success = $true; count = $arr.Count; lastModified = $global:LastModified }
                    } else {
                        Send-HttpResponse $response @{ success = $false; error = "Data kosong" } 400
                    }
                } catch {
                    Send-HttpResponse $response @{ success = $false; error = $_.Exception.Message } 500
                }
                continue
            }

            if ($rawUrl -eq "/api/transactions" -and $method -eq "POST") {
                try {
                    $payload = $body | ConvertFrom-Json
                    $arr = if ($payload -is [System.Array]) { $payload } else { $payload.transactions }
                    Write-JsonDbFile "transactions.json" $arr | Out-Null
                    Send-HttpResponse $response @{ success = $true; count = $arr.Count; lastModified = $global:LastModified }
                } catch {
                    Send-HttpResponse $response @{ success = $false; error = $_.Exception.Message } 500
                }
                continue
            }

            if ($rawUrl -eq "/api/take-item" -and $method -eq "POST") {
                try {
                    $payload = $body | ConvertFrom-Json
                    $trx = $payload.transaction
                    $barangId = $payload.barangId
                    $stokKeluar = [double]($payload.stokKeluar)

                    $inventory = @(Read-JsonDbFile "inventory.json" @())
                    $transactions = @(Read-JsonDbFile "transactions.json" @())

                    $found = $null
                    foreach ($item in $inventory) {
                        if ($item.id -eq $barangId) {
                            $item.stokKeluar = [double]($item.stokKeluar) + $stokKeluar
                            if ($payload.stokAkhir -ne $null) {
                                $item.stokAkhir = [double]($payload.stokAkhir)
                            } else {
                                $item.stokAkhir = [Math]::Max(0.0, [double]($item.stokAkhir) - $stokKeluar)
                            }
                            $item.kondisi = if ($item.stokAkhir -gt 0) { "Tersedia" } else { "Habis" }
                            $found = $item
                            break
                        }
                    }

                    $newTrxList = @($trx) + $transactions
                    Write-JsonDbFile "inventory.json" $inventory | Out-Null
                    Write-JsonDbFile "transactions.json" $newTrxList | Out-Null

                    Send-HttpResponse $response @{
                        success = $true
                        updatedItem = $found
                        transaction = $trx
                        lastModified = $global:LastModified
                    }
                } catch {
                    Send-HttpResponse $response @{ success = $false; error = $_.Exception.Message } 500
                }
                continue
            }

            # File Statis
            $relPath = $rawUrl.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }
            $filePath = Join-Path $publicDir $relPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $ctype = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentType = $ctype
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
            } else {
                $response.StatusCode = 404
                $response.ContentType = "text/html; charset=utf-8"
                $errHtml = "<h1>404 Tidak Ditemukan</h1>"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($errHtml)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
            }
        } catch {}
    }
} else {
    # Mode 2: TcpListener (Universal Fallback yang 100% bekerja di semua hak akses Windows)
    $endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, $Port)
    $tcp = New-Object System.Net.Sockets.TcpListener($endpoint)
    $tcp.Start()

    while ($true) {
        try {
            $client = $tcp.AcceptTcpClient()
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
            $reqLine = $reader.ReadLine()
            if (-not $reqLine) { $client.Close(); continue }

            $parts = $reqLine.Split(' ')
            $method = $parts[0]
            $fullUrl = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
            $urlParts = $fullUrl.Split('?')
            $pathname = $urlParts[0]
            $queryStr = if ($urlParts.Length -gt 1) { $urlParts[1] } else { "" }

            # Baca Header
            $headers = @{}
            $contentLength = 0
            while ($true) {
                $line = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($line)) { break }
                $hParts = $line.Split(':', 2)
                if ($hParts.Length -eq 2) {
                    $key = $hParts[0].Trim().ToLower()
                    $val = $hParts[1].Trim()
                    $headers[$key] = $val
                    if ($key -eq "content-length") { [int]::TryParse($val, [ref]$contentLength) | Out-Null }
                }
            }

            # Baca Body jika POST
            $body = ""
            if ($contentLength -gt 0) {
                $buffer = New-Object char[] $contentLength
                $readTotal = 0
                while ($readTotal -lt $contentLength) {
                    $r = $reader.Read($buffer, $readTotal, $contentLength - $readTotal)
                    if ($r -le 0) { break }
                    $readTotal += $r
                }
                $body = New-Object string ($buffer, 0, $readTotal)
            }

            function Send-TcpJson($obj, [int]$status = 200) {
                $j = $obj | ConvertTo-Json -Depth 10 -Compress
                $b = [System.Text.Encoding]::UTF8.GetBytes($j)
                $head = "HTTP/1.1 $status OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type, Authorization`r`nContent-Length: $($b.Length)`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Write($b, 0, $b.Length)
                $stream.Flush()
            }

            if ($method -eq "OPTIONS") {
                $head = "HTTP/1.1 204 No Content`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type, Authorization`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Flush()
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/status" -and $method -eq "GET") {
                Send-TcpJson @{
                    status = "online"
                    engine = "powershell_tcplistener"
                    satker = "Rutan Kelas II B Siak Sri Indrapura"
                    kodeUakpb = "137.04.0900.692310.000.KD"
                    localIp = $localIp
                    port = $Port
                    storageDirectory = $dbDir
                    lastModified = $global:LastModified
                }
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/sync-poll" -and $method -eq "GET") {
                $since = 0
                if ($queryStr -match "since=(\d+)") { [long]::TryParse($matches[1], [ref]$since) | Out-Null }
                $hasUpdate = ($global:LastModified -gt $since)
                Send-TcpJson @{ hasUpdate = $hasUpdate; lastModified = $global:LastModified }
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/data" -and $method -eq "GET") {
                $inv = Read-JsonDbFile "inventory.json" @()
                $trx = Read-JsonDbFile "transactions.json" @()
                $off = Read-JsonDbFile "officers.json" @()
                $usr = Read-JsonDbFile "users.json" @()
                $sat = Read-JsonDbFile "satker.json" @{}
                Send-TcpJson @{
                    success = $true
                    data = @{
                        inventory = $inv
                        transactions = $trx
                        officers = $off
                        users = $usr
                        satker = $sat
                    }
                    lastModified = $global:LastModified
                }
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/inventory" -and $method -eq "POST") {
                $payload = $body | ConvertFrom-Json
                $arr = if ($payload -is [System.Array]) { $payload } else { $payload.inventory }
                Write-JsonDbFile "inventory.json" $arr | Out-Null
                Send-TcpJson @{ success = $true; count = $arr.Count; lastModified = $global:LastModified }
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/transactions" -and $method -eq "POST") {
                $payload = $body | ConvertFrom-Json
                $arr = if ($payload -is [System.Array]) { $payload } else { $payload.transactions }
                Write-JsonDbFile "transactions.json" $arr | Out-Null
                Send-TcpJson @{ success = $true; count = $arr.Count; lastModified = $global:LastModified }
                $client.Close()
                continue
            }

            if ($pathname -eq "/api/take-item" -and $method -eq "POST") {
                $payload = $body | ConvertFrom-Json
                $trx = $payload.transaction
                $barangId = $payload.barangId
                $stokKeluar = [double]($payload.stokKeluar)

                $inventory = @(Read-JsonDbFile "inventory.json" @())
                $transactions = @(Read-JsonDbFile "transactions.json" @())

                $found = $null
                foreach ($item in $inventory) {
                    if ($item.id -eq $barangId) {
                        $item.stokKeluar = [double]($item.stokKeluar) + $stokKeluar
                        if ($payload.stokAkhir -ne $null) {
                            $item.stokAkhir = [double]($payload.stokAkhir)
                        } else {
                            $item.stokAkhir = [Math]::Max(0.0, [double]($item.stokAkhir) - $stokKeluar)
                        }
                        $item.kondisi = if ($item.stokAkhir -gt 0) { "Tersedia" } else { "Habis" }
                        $found = $item
                        break
                    }
                }

                $newTrxList = @($trx) + $transactions
                Write-JsonDbFile "inventory.json" $inventory | Out-Null
                Write-JsonDbFile "transactions.json" $newTrxList | Out-Null

                Send-TcpJson @{ success = $true; updatedItem = $found; transaction = $trx; lastModified = $global:LastModified }
                $client.Close()
                continue
            }

            # File Statis
            $relPath = $pathname.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }
            $filePath = Join-Path $publicDir $relPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $ctype = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                $head = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($fileBytes.Length)`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
                $stream.Flush()
            } else {
                $errHtml = "<h1>404 Tidak Ditemukan</h1>"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errHtml)
                $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($errBytes.Length)`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Write($errBytes, 0, $errBytes.Length)
                $stream.Flush()
            }
            $client.Close()
        } catch {
            if ($client) { try { $client.Close() } catch {} }
        }
    }
}
