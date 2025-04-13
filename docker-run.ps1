# PowerShell script to run the dockerized LMS application

Write-Host "Building and starting the LMS application..." -ForegroundColor Green

# Build and start the containers
docker-compose up --build -d

Write-Host "Containers are starting up..." -ForegroundColor Yellow
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:5000" -ForegroundColor Cyan

Write-Host "`nTo view logs, run: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop the application, run: docker-compose down" -ForegroundColor Gray 