# Audio Converter Service Setup

## Overview
The Audio Converter Service converts various audio formats (MP3, M4A, OGG, FLAC) to WAV format with optimal settings for speech recognition (16kHz, mono, PCM 16-bit).

## Service Details

### Location
- **Service File**: `/home/z/my-project/mini-services/audio-converter-service/converter.py`
- **Port**: 3004
- **Technology**: Python Flask + FFmpeg binary

### Supported Input Formats
- WAV (no conversion needed)
- WebM (no conversion needed)
- MP3 → WAV
- M4A → WAV
- OGG → WAV
- FLAC → WAV

### Output Format
- **WAV**
- Sample Rate: 16kHz (optimal for ASR)
- Channels: Mono
- Codec: PCM 16-bit

## Starting the Service

### Quick Start
```bash
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH
nohup python3 /home/z/my-project/mini-services/audio-converter-service/converter.py > /tmp/audio-converter.log 2>&1 &
```

### Check Service Status
```bash
curl http://localhost:3004/health
```

### Stop Service
```bash
pkill -f "converter.py"
```

## Service Endpoints

### Health Check
GET http://localhost:3004/health

### Convert from Base64
POST http://localhost:3004/convert-base64
Content-Type: application/json
{
  "audioData": "base64_encoded_audio",
  "inputFormat": "mp3"
}

## Integration
The main application automatically detects file formats and converts non-WAV/WebM files before transcription.
