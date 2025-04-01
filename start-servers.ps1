# PowerShell script to start both frontend and backend servers

Write-Host "Starting LMS application servers..." -ForegroundColor Green

# Define paths
$basePath = Get-Location
$backendPath = Join-Path -Path $basePath -ChildPath "backend"
$frontendPath = Join-Path -Path $basePath -ChildPath "frontend"

# Function to check if directory exists
function Test-DirectoryExists {
    param (
        [string]$Path,
        [string]$Name
    )
    
    if (-not (Test-Path -Path $Path -PathType Container)) {
        Write-Host "Error: $Name directory not found at $Path" -ForegroundColor Red
        exit 1
    }
}

# Check if directories exist
Test-DirectoryExists -Path $backendPath -Name "Backend"
Test-DirectoryExists -Path $frontendPath -Name "Frontend"

# Start backend server in a new PowerShell window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm run dev"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend server in a new PowerShell window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "You can close this window, but keep the other terminal windows open to keep the servers running." -ForegroundColor Magenta 