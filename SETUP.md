# HASAD Local Development Setup

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hasad-mvp
   ```

2. **Create environment file**
   ```bash
   cp .env.example backend/.env
   ```

3. **Edit backend/.env and add your API keys**
   ```bash
   # Open backend/.env in your editor
   # Replace the placeholder values with your actual API keys:

   OPENWEATHER_API_KEY=your_actual_openweathermap_key
   ANTHROPIC_API_KEY=your_actual_anthropic_key
   ```

## Environment Variables Explained

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `OPENWEATHER_API_KEY` | Yes | Weather data API key | [OpenWeatherMap](https://openweathermap.org/api) |
| `ANTHROPIC_API_KEY` | Yes* | AI assistant API key | [Anthropic Console](https://console.anthropic.com/) |
| `DATABASE_URL` | No | Database connection (Docker sets this) | - |
| `JWT_SECRET` | No | JWT signing secret (Docker sets this) | - |

*Required for AI assistant feature. Without it, the assistant will return 503 errors.

## Running with Docker

### Build and start all services:
```bash
docker-compose up --build
```

### Start in detached mode:
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### Stop and remove volumes:
```bash
docker-compose down -v
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (user: hasad, password: hasad_password)

## Verifying Setup

### 1. Check if backend is running:
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"ok","app":"HASAD"}`

### 2. Check if database is connected:
Visit http://localhost:8000/docs and try the `/api/v1/auth/register` endpoint

### 3. Test weather API:
After creating a farm, try fetching weather at `/api/v1/farms/{id}/weather/current`

### 4. Test AI assistant:
After creating a farm and getting weather, try the assistant at `/api/v1/assistant/chat`

## Troubleshooting

### "Database connection failed"
- Ensure PostgreSQL container is healthy
- Check `docker-compose logs db`

### "Weather API not working"
- Verify `OPENWEATHER_API_KEY` is set correctly in backend/.env
- Check backend logs for API errors

### "AI assistant not working"
- Verify `ANTHROPIC_API_KEY` is set correctly in backend/.env
- Check backend logs for API errors

### Frontend can't connect to backend
- Ensure both services are running
- Check `REACT_APP_API_BASE` environment in docker-compose.yml
- Try accessing backend API directly at http://localhost:8000

## Development Mode (without Docker)

### Backend:
```bash
cd backend
pip install -r requirements.txt
# Copy .env.example to .env and add API keys
uvicorn app.main:app --reload
```

### Frontend:
```bash
cd frontend
npm install
npm start
```

## Notes

- All API keys are loaded from backend/.env
- The .env file is ignored by git (see .gitignore)
- Never commit .env file to version control
- For production, use environment-specific values and secrets management
