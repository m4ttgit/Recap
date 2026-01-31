# Installation Instructions

## Prerequisites

- Node.js 18+ or Bun 1+
- Python 3+ (for audio converter service)
- FFmpeg (for audio conversion)

## Installation

### Option 1: Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev
```

### Option 2: Using npm

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push

# Start development server
npm run dev:npm
```

## Available Scripts

### Development
- `bun run dev` or `npm run dev:npm` - Start development server on port 3000

### Building
- `bun run build` or `npm run build:npm` - Build for production

### Production
- `bun run start` or `npm run start:npm` - Start production server

### Database
- `bun run db:push` - Push schema to database
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:reset` - Reset database

### Linting
- `bun run lint` - Run ESLint

### Installation
- `bun install` - Install dependencies with Bun
- `npm install` - Install dependencies with npm
- `npm install --save-dev` - Install dev dependencies with npm

## Starting Services

### Main Application
The main application starts automatically with `bun run dev` or `npm run dev:npm`.

### Audio Converter Service (Required for MP3/M4A/OGG/FLAC)

```bash
cd mini-services/audio-converter-service

# Start with Python
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH
python3 converter.py

# Or check if FFmpeg is installed
ffmpeg -version

# Check service health
curl http://localhost:3004/health
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./db/custom.db"
CONVERTER_SERVICE_URL="http://localhost:3004"
DIARIZATION_SERVICE_URL="http://localhost:3002"
```

## Project Structure

```
.
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/             # Utility functions
├── mini-services/        # Background services
│   └── audio-converter-service/  # Audio format conversion
├── prisma/              # Database schema and migrations
├── db/                  # SQLite database files
└── public/              # Static assets
```

## Features

- ✅ Audio transcription (WAV, WebM, MP3, M4A, OGG, FLAC)
- ✅ Automatic audio format conversion
- ✅ Speaker diarization (optional)
- ✅ Meeting report generation
- ✅ Multiple AI provider support (Settings page)
- ✅ Custom model configuration
- ✅ Statistics dashboard
- ✅ Responsive design

## Troubleshooting

### Installation Issues

**Bun not working?**
```bash
# Use npm instead
npm install
npm run dev:npm
```

**npm install failing?**
```bash
# Try clearing cache
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

**Audio converter not running?**
```bash
# Check if service is running
ps aux | grep converter.py

# Start it
cd mini-services/audio-converter-service
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH
python3 converter.py
```

**Port 3000 already in use?**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

## Development

The application runs on:
- Main app: http://localhost:3000
- Statistics: http://localhost:3000/stats
- Settings: http://localhost:3000/settings
- Audio converter: http://localhost:3004/health

## Production Deployment

Build the application:
```bash
bun run build
# or
npm run build:npm
```

Start production server:
```bash
bun run start
# or
npm run start:npm
```

## Support

For issues or questions, please refer to the documentation files:
- AUDIO_CONVERTER_SERVICE.md - Audio conversion setup
- AUDIO_DURATION_STATUS.md - Audio duration limits
- CUSTOM_MODEL_FEATURE.md - Custom model configuration
- ENABLED_FORMATS_SUMMARY.md - Supported audio formats
- DASHBOARD_FIX.md - Dashboard routing fix
- UNLIMITED_AUDIO_DURATION.md - Duration support details
