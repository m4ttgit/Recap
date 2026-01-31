# Audio Format Support - Enabled

## Summary
All common audio formats are now supported for transcription:
- ✅ WAV (native support, no conversion)
- ✅ WebM (native support, no conversion)
- ✅ MP3 (converted to WAV)
- ✅ M4A (converted to WAV)
- ✅ OGG (converted to WAV)
- ✅ FLAC (converted to WAV)

## Architecture

### Frontend (src/app/page.tsx)
- Accepts all audio formats
- Detects file type automatically
- Sends to converter service if needed
- Forwards converted WAV to ASR

### Audio Converter Service (port 3004)
- Python Flask application
- Uses FFmpeg binary for conversion
- Converts to optimal ASR format (16kHz, mono, PCM 16-bit)
- Runs in background

### Backend API (/api/transcribe)
- Receives audio file
- Checks format
- Converts if not WAV/WebM
- Transcribes using ASR
- Returns transcription

## Conversion Process

1. User uploads MP3/M4A/OGG/FLAC file
2. Frontend detects format
3. Sends to converter service (port 3004)
4. Converter uses FFmpeg to convert to WAV
5. Converted WAV sent to ASR
6. Transcription returned to user

## Service Status

### Audio Converter Service
- **Status**: ✅ Running
- **Port**: 3004
- **Health**: Healthy
- **FFmpeg**: Available

### Main Application
- **Status**: ✅ Running
- **Port**: 3000
- **All Formats**: Enabled

## User Experience

1. Upload any supported audio format
2. Click "Transcribe Audio"
3. If conversion needed: shows "Converting audio..."
4. Then: "Transcribing audio..."
5. Complete: Shows transcription

## Supported Formats Details

| Format | Extension | Conversion | Time |
|--------|-----------|------------|------|
| WAV | .wav | None | Instant |
| WebM | .webm | None | Instant |
| MP3 | .mp3 | MP3 → WAV | ~1-3s/min |
| M4A | .m4a | M4A → WAV | ~1-3s/min |
| OGG | .ogg | OGG → WAV | ~1-3s/min |
| FLAC | .flac | FLAC → WAV | ~1-2s/min |

## File Size Limit
- Maximum: 100MB
- Recommendation: <50MB for best performance

## Quality Settings
All converted files use optimal ASR settings:
- Sample Rate: 16kHz
- Channels: Mono
- Bit Depth: 16-bit PCM

## Troubleshooting

### Conversion Errors
If you see "Audio converter service is not running":
```bash
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH
nohup python3 /home/z/my-project/mini-services/audio-converter-service/converter.py > /tmp/audio-converter.log 2>&1 &
```

### Check Service Health
```bash
curl http://localhost:3004/health
```

### View Service Logs
```bash
tail -f /tmp/audio-converter.log
```
