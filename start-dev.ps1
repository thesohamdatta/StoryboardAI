# Storyboard Platform Development Startup Script

Write-Host "Starting Storyboard Platform..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "`nWARNING: Docker Desktop is not running!" -ForegroundColor Yellow
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Write-Host "Or start PostgreSQL manually and update DATABASE_URL in backend/.env`n" -ForegroundColor Yellow
    exit 1
}

# Start Docker services
Write-Host "`nStarting Docker services (PostgreSQL, MinIO)..." -ForegroundColor Cyan
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Run database migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Cyan
cd backend
$env:DATABASE_URL = "postgresql://storyboard:storyboard_dev@localhost:5432/storyboard_db"
# Note: You may need to run migrations manually with psql or a migration tool
cd ..

# Start services
Write-Host "`nStarting services..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "AI Service: http://localhost:3002" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor Yellow

# Start all services concurrently
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All services started! Check the terminal windows for logs." -ForegroundColor Green
