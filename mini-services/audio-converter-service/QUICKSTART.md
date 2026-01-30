# Audio Converter Service - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd mini-services/audio-converter-service
npm install
```

### 2. Start the Service
```bash
npm run dev
```

### 3. Verify It's Working
```bash
curl http://localhost:3004/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "audio-converter",
  "version": "1.0.0"
}
```

## 📋 What This Service Does

Converts audio files to WAV format so they work with the transcription service:
- MP3 → WAV
- M4A → WAV
- OGG → WAV
- FLAC → WAV

## 🎯 When You Need It

You need this service when users upload audio in formats other than WAV or WebM, which is common with:
- iPhone recordings (M4A)
- Android recordings (MP3)
- Other recording apps (various formats)

## 🔧 Troubleshooting

### Port 3004 Already in Use?
```bash
# Find what's using the port
lsof -i :3004  # macOS/Linux
netstat -ano | findstr :3004  # Windows

# Kill the process or change the port in index.js
```

### Module Not Found Error?
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Service Won't Start?
```bash
# Check Node.js version (needs 14+)
node --version

# Update if needed
```

## 📊 Monitoring

Check the service is running:
```bash
curl http://localhost:3004/health
```

You should see: `{"status":"healthy",...}`

## 💡 Tips

- **First run**: Downloads FFmpeg WASM (~25MB), so it may take a few seconds
- **Memory**: Uses ~100-300MB RAM for typical files
- **Performance**: Converts 5-minute files in 1-3 seconds

## 📚 More Info

- Full documentation: `README.md`
- API guide: `../../docs/AUDIO_CONVERSION_GUIDE.md`
