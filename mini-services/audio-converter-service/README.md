# Audio Converter Service

A Node.js service for converting audio files to WAV format using FFmpeg. This service is designed to support the Meeting Transcriber app by converting various audio formats (MP3, M4A, OGG, FLAC, etc.) to WAV format that's compatible with the z-ai-web-dev-sdk ASR.

## Features

- **Format Conversion**: Converts various audio formats to WAV
- **Optimized for ASR**: Outputs 16kHz, mono, PCM 16-bit audio (optimal for speech recognition)
- **Multiple Input Methods**: Supports both base64 data and file uploads
- **Fast Processing**: Uses @ffmpeg/ffmpeg for in-memory conversion
- **REST API**: Simple HTTP endpoints for integration

## Supported Input Formats

- MP3
- M4A
- OGG
- FLAC
- WebM
- WAV
- And many more formats supported by FFmpeg

## Output Format

- **Format**: WAV
- **Sample Rate**: 16,000 Hz (16kHz)
- **Channels**: Mono (1 channel)
- **Codec**: PCM 16-bit

## Installation

```bash
cd mini-services/audio-converter-service
npm install
```

## Usage

### Start the Service

```bash
npm run dev
```

The service will start on port 3004.

### API Endpoints

#### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "audio-converter",
  "version": "1.0.0"
}
```

#### Convert from Base64
```
POST /convert-base64
Content-Type: application/json

Request body:
{
  "audioData": "base64_encoded_audio",
  "inputFormat": "mp3",
  "outputFormat": "wav" (optional, defaults to "wav")
}
```

Response:
```json
{
  "success": true,
  "outputFormat": "wav",
  "audioData": "base64_encoded_wav",
  "size": 1234567
}
```

#### Convert from File Upload
```
POST /convert
Content-Type: multipart/form-data

Parameters:
- audio: Audio file
- outputFormat: "wav" (optional, defaults to "wav")
```

Response:
```json
{
  "success": true,
  "outputFormat": "wav",
  "audioData": "base64_encoded_wav",
  "size": 1234567,
  "originalFormat": "mp3"
}
```

## Integration with Next.js

The service integrates with the Next.js transcription API:

1. Client uploads audio file (any format)
2. Next.js API detects format
3. If not WAV/WebM, calls converter service
4. Gets converted WAV back
5. Proceeds with transcription

## Example Integration

```javascript
async function convertAudio(base64Audio, inputFormat) {
  const response = await fetch('http://localhost:3004/convert-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audioData: base64Audio,
      inputFormat: inputFormat,
      outputFormat: 'wav'
    })
  });

  const data = await response.json();
  return data.audioData; // Base64 encoded WAV
}
```

## Technical Details

### FFmpeg Settings for ASR Optimization

The service uses these FFmpeg parameters to optimize audio for speech recognition:

```bash
-i input.mp3          # Input file
-acodec pcm_s16le     # PCM 16-bit codec (WAV standard)
-ar 16000             # 16kHz sample rate (optimal for ASR)
-ac 1                 # Mono channel
-y                    # Overwrite output file
output.wav            # Output file
```

### Why These Settings?

- **16kHz Sample Rate**: Optimal for speech recognition models
- **Mono**: Reduces file size and ASR models typically process mono
- **PCM 16-bit**: Standard WAV format, widely supported

## Performance

- **Conversion Time**: Typically 1-3 seconds for a 5-minute audio file
- **Memory Usage**: Processes files in memory (no disk I/O)
- **File Size Limit**: 100MB (configurable)

## Troubleshooting

### "FFmpeg not loaded" Error
- Ensure the service has internet access on first run (downloads FFmpeg WASM)
- Check browser console for WASM loading errors

### Conversion Fails
- Verify the input format is supported by FFmpeg
- Check the audio file is not corrupted
- Ensure file size is under 100MB limit

### Slow Conversion
- Large files (>50MB) will take longer
- Consider server-side FFmpeg instead of WASM for production

## Production Considerations

For production use, consider:

1. **Use native FFmpeg** instead of @ffmpeg/ffmpeg for better performance
2. **Implement caching** for frequently converted files
3. **Add rate limiting** to prevent abuse
4. **Use a queue system** for large files
5. **Add monitoring** for conversion failures

## License

MIT
