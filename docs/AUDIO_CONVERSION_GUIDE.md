# Audio Format Conversion Guide

## Overview

The Meeting Transcriber app now supports automatic audio format conversion, allowing users to upload audio in various formats commonly used by smartphones and recording devices. The backend automatically converts unsupported formats to WAV, which is required by the z-ai-web-dev-sdk ASR service.

## Supported Formats

### Directly Supported (No Conversion Needed)
- ✅ **WAV** - Lossless uncompressed audio
- ✅ **WebM** - Web audio format

### Automatically Converted to WAV
- 🔄 **MP3** → WAV (Most common phone recording format)
- 🔄 **M4A** → WAV (iPhone/iOS default format)
- 🔄 **OGG** → WAV (Open source audio format)
- 🔄 **FLAC** → WAV (Lossless compressed audio)

## How It Works

### Flow Diagram

```
┌─────────────┐
│ User Uploads│
│ Audio File  │
│ (Any Format)│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Frontend       │
│  Validation     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Transcribe API  │
│  Detect Format  │
└──────┬──────────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ WAV/WebM     │  │ Other Formats    │
│ (Direct)     │  │ (Convert Needed) │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │                   ▼
       │          ┌─────────────────┐
       │          │ Converter       │
       │          │ Service (Port   │
       │          │ 3004)           │
       │          └────────┬────────┘
       │                   │
       │                   ▼
       │          ┌─────────────────┐
       │          │ WAV Output      │
       │          │ (16kHz, Mono)   │
       │          └────────┬────────┘
       │                   │
       └────────┬──────────┘
                │
                ▼
       ┌─────────────────┐
       │ ASR Service     │
       │ (Transcription) │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Return Result   │
       └─────────────────┘
```

## Audio Converter Service

### Location
`mini-services/audio-converter-service/`

### Technology Stack
- **Node.js** - Runtime environment
- **Express** - Web framework
- **@ffmpeg/ffmpeg** - FFmpeg WASM for audio conversion
- **Multer** - File upload handling
- **CORS** - Cross-origin support

### Features
- In-memory conversion (no disk I/O)
- Optimized for ASR (16kHz, mono, PCM 16-bit)
- REST API for easy integration
- Support for base64 and file upload
- Fast processing (1-3 seconds for typical files)

### Conversion Settings

The converter uses these FFmpeg parameters for optimal ASR performance:

```bash
-i input.mp3          # Input file
-acodec pcm_s16le     # PCM 16-bit codec (WAV standard)
-ar 16000             # 16kHz sample rate (optimal for ASR)
-ac 1                 # Mono channel
-y                    # Overwrite output file
output.wav            # Output file
```

### Why These Settings?

| Setting | Value | Reason |
|---------|-------|--------|
| Sample Rate | 16,000 Hz | Optimal for speech recognition models |
| Channels | Mono (1) | Reduces size, ASR typically processes mono |
| Codec | PCM 16-bit | Standard WAV format, widely supported |
| Bit Depth | 16-bit | Good balance of quality and size |

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd mini-services/audio-converter-service
npm install
```

### Step 2: Start the Service

```bash
npm run dev
```

The service will start on port **3004**.

### Step 3: Verify Service is Running

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

## API Endpoints

### Health Check
```
GET /health
```

### Convert from Base64
```
POST /convert-base64
Content-Type: application/json

{
  "audioData": "base64_encoded_audio",
  "inputFormat": "mp3",
  "outputFormat": "wav"
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

### Convert from File Upload
```
POST /convert
Content-Type: multipart/form-data

Parameters:
- audio: Audio file
- outputFormat: "wav" (optional)
```

## User Experience

### Upload Flow

1. **User uploads audio file** (e.g., MP3 from phone)
2. **Frontend validates format** (accepts all common formats)
3. **API detects format** (MP3 detected)
4. **Automatic conversion** (MP3 → WAV)
5. **Transcription proceeds** (using converted WAV)
6. **User sees success message**: "Successfully transcribed 150 words. Converted from MP3 to WAV."

### Success Notification Examples

**With Conversion:**
> "Successfully transcribed 150 words. Converted from MP3 to WAV. 2 speakers detected."

**Without Conversion:**
> "Successfully transcribed 200 words. 3 speakers detected."

## Performance

### Typical Conversion Times

| File Duration | File Size (MP3) | Conversion Time |
|---------------|-----------------|-----------------|
| 1 minute | ~1 MB | 1-2 seconds |
| 5 minutes | ~5 MB | 2-4 seconds |
| 10 minutes | ~10 MB | 4-6 seconds |
| 30 minutes | ~30 MB | 8-12 seconds |

### Factors Affecting Performance

- **File size**: Larger files take longer
- **Input format**: Some formats convert faster than others
- **System resources**: CPU and memory availability
- **Network latency**: For remote conversion service

## Troubleshooting

### Issue: "Conversion failed" error

**Possible causes:**
1. Converter service not running
2. Invalid audio file
3. Unsupported format

**Solutions:**
1. Check converter service is running: `curl http://localhost:3004/health`
2. Verify the audio file is not corrupted
3. Check the file extension matches the actual format

### Issue: Slow conversion

**Possible causes:**
1. Large file (>50MB)
2. Limited system resources
3. Network latency

**Solutions:**
1. Consider using smaller files
2. Allocate more resources to the service
3. Host converter service closer to the main app

### Issue: Converter service won't start

**Possible causes:**
1. Port 3004 already in use
2. Dependencies not installed
3. FFmpeg WASM download failed

**Solutions:**
1. Check if port is in use: `lsof -i :3004`
2. Reinstall dependencies: `npm install`
3. Ensure internet connection for first run (downloads FFmpeg WASM)

### Issue: "Audio format conversion failed: unsupported audio format"

**Possible causes:**
1. Corrupted audio file
2. Format not supported by FFmpeg
3. Invalid file extension

**Solutions:**
1. Try playing the file in a media player to verify it's valid
2. Convert the file manually using a tool like Audacity
3. Ensure the file has the correct extension

## Common Phone Recording Formats

### iPhone/iOS
- **Default**: M4A (AAC codec)
- **Status**: ✅ Automatically converted to WAV
- **Quality**: Usually good, suitable for transcription

### Android
- **Default**: Varies by device (MP3, M4A, AMR, OGG)
- **Status**: ✅ MP3, M4A, OGG automatically converted
- **Note**: AMR format not supported, use a different recording app

### Samsung Voice Recorder
- **Formats**: M4A, 3GA
- **Status**: ✅ M4A supported, 3GA may need manual conversion

### Google Voice Recorder
- **Formats**: WAV, MP3
- **Status**: ✅ Both supported (WAV direct, MP3 converted)

## Best Practices

### For Users

1. **Use recommended formats**: WAV or MP3 work best
2. **Keep files under 100MB**: Larger files may timeout
3. **Ensure clear audio**: Better quality = better transcription
4. **Minimize background noise**: Improves accuracy
5. **Check recording quality**: Before uploading, listen to the recording

### For Developers

1. **Monitor conversion service**: Check health endpoint regularly
2. **Implement caching**: Cache converted files for repeat uploads
3. **Add rate limiting**: Prevent abuse of the conversion service
4. **Log conversion failures**: Track and analyze errors
5. **Consider queue system**: For high-volume usage

## Production Considerations

### Scaling

For production deployment with high traffic:

1. **Use native FFmpeg** instead of WASM for better performance
2. **Implement a queue system** (Redis, RabbitMQ) for processing
3. **Add load balancing** for multiple converter instances
4. **Use CDN** for serving FFmpeg WASM files
5. **Implement caching layer** (Redis) for converted files

### Monitoring

Monitor these metrics:
- Conversion success rate
- Average conversion time
- Service health status
- Error rates by format
- Resource utilization (CPU, memory)

### Security

- Validate file types before processing
- Sanitize file names
- Limit file sizes
- Implement rate limiting
- Use HTTPS for all requests

## Future Enhancements

Potential improvements:

1. **Support more formats**: AMR, WMA, AAC
2. **Audio quality enhancement**: Noise reduction, normalization
3. **Batch conversion**: Process multiple files at once
4. **Conversion presets**: Different settings for different use cases
4. **Progress tracking**: Real-time conversion progress
5. **Smart format detection**: Better handling of mislabeled files

## Technical Notes

### FFmpeg WASM vs Native FFmpeg

**FFmpeg WASM** (Current):
- ✅ Easy deployment
- ✅ Cross-platform
- ✅ No native dependencies
- ❌ Slower than native
- ❌ Higher memory usage

**Native FFmpeg** (Future):
- ✅ Faster processing
- ✅ Lower memory usage
- ✅ Better performance
- ❌ Requires FFmpeg installation
- ❌ Platform-specific setup

### Memory Usage

FFmpeg WASM processes files entirely in memory:
- Small files (<10MB): ~50-100MB RAM
- Medium files (10-50MB): ~100-300MB RAM
- Large files (50-100MB): ~300-500MB RAM

Ensure sufficient memory is allocated to the converter service.

## Support

For issues related to:
- **Converter service**: Check `mini-services/audio-converter-service/README.md`
- **FFmpeg WASM**: Visit https://github.com/ffmpegwasm/ffmpeg.wasm
- **App integration**: Check the main app documentation

## License

MIT
