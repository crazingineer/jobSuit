# jobSuite: Launch Chrome with Chrome DevTools Protocol (CDP) enabled
# Allows jobSuite to attach to your real logged-in session without lock conflicts or bot bans

$ChromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$ChromeExe = $ChromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $ChromeExe) {
    Write-Host "Google Chrome executable not found!" -ForegroundColor Red
    exit 1
}

$Port = 9222
Write-Host "Starting Chrome with Remote Debugging on Port $Port..." -ForegroundColor Cyan
Write-Host "This allows jobSuite Playwright to connect to your LinkedIn and Naukri sessions directly via CDP." -ForegroundColor Green

# Launch Chrome with remote debugging port
Start-Process -FilePath $ChromeExe -ArgumentList "--remote-debugging-port=$Port", "--restore-last-session"

Write-Host "Chrome launched on port $Port! jobSuite can now attach seamlessly." -ForegroundColor Green
