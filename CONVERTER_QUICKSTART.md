# Quick Start Guide - Audio Converter Service

## ⚠️ Important: Converter Service Required

The audio converter service **must be running** to transcribe non-WAV/WebM files (MP3, M4A, OGG, FLAC).

## 🚀 Start the Converter Service

```bash
# Navigate to the converter service
cd mini-services/audio-converter-service

# Install dependencies (first time only)
npm install

# Start the service
npm run dev
```

The service will start on port **3004**.

## ✅ Verify It's Running

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

## 🎯 What Happens Without the Converter

- ✅ **WAV/WebM files**: Work fine (no conversion needed)
- ❌ **MP3/M4A/OGG/FLAC files**: Will fail with "Converter service is not running" error

## 📱 How to Test

1. **Start the converter service** (see above)
2. Upload an MP3 file in the app
3. Click "Transcribe Audio"
4. It should work!

## 🔧 Troubleshooting

### "Converter service is not running" error

**Solution 1**: Start the service
```bash
cd mini-services/audio-converter-service
npm run dev
```

**Solution 2**: Check if port 3004 is available
```bash
# On macOS/Linux
lsof -i :3004

# On Windows
netstat -ano | findstr :3004
```

If port is in use, either:
- Kill the process using it
- Or change the port in `mini-services/audio-converter-service/index.js`

### "Module not found" error

**Solution**: Reinstall dependencies
```bash
cd mini-services/audio-converter-service
rm -rf node_modules package-lock.json
npm install
```

### Service starts but fails to convert

**Solution**: Check for errors in the service terminal. Common issues:
- Missing dependencies
- FFmpeg WASM download failed (check internet connection)
- Insufficient memory

## 📊 Automatic vs Manual Conversion

### Automatic (App Handles It)
- Upload any format (MP3, M4A, etc.)
- App detects format
- Calls converter service if needed
- Proceeds with transcription

### Manual (Convert Before Upload)
If you don't want to run the converter service:
1. Use an online tool (e.g., online-audio-converter.com)
2. Convert MP3/M4A to WAV
3. Upload the WAV file to the app
4. No conversion service needed

## 🏃‍♂️ Quick Commands

```bash
# One command to install and start (first time)
cd mini-services/audio-converter-service && npm install && npm run dev

# In a new terminal (subsequent times)
cd mini-services/audio-converter-service && npm run dev
```

## 📝 Remember

- **Port 3004** must be free
- **Node.js** must be installed
- **Internet connection** needed for first run (downloads FFmpeg WASM)
- **Run in background** for continuous operation

## 💡 Pro Tip

For development, keep the converter service running in a separate terminal so you don't have to restart it every time you test the app.
