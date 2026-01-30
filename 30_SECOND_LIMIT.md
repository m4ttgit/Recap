# Audio Duration Limit - 30 Seconds

## Issue
The ASR service has a maximum audio duration limit of **30 seconds** per transcription.

## Error Message
```
transcriptions文件时长限制为0-30秒
```
(Translation: "Transcription files are limited to 0-30 seconds")

## Solution Implemented

### 1. Frontend Validation (src/app/page.tsx)
- Estimates audio duration based on file size
- Uses conservative bitrate estimate (64 kbps)
- Rejects files estimated to be longer than 25 seconds
- Shows clear error message with estimated duration

### 2. Backend Validation (src/app/api/transcribe/route.ts)
- Estimates duration more accurately per format
- Uses format-specific bitrate estimates
- Validates before attempting transcription
- Returns detailed error message if too long

### 3. User Interface Updates
- Updated description: "Maximum 30 seconds"
- Updated file size hint: "Max 30 seconds"
- Clear error messages when file is too long

## Duration Estimation

The system estimates duration using file size and format-specific bitrates:

| Format | Estimated Bitrate | Notes |
|--------|-------------------|-------|
| WAV | 1411 kbps | 16kHz, mono, 16-bit PCM |
| WebM | 64 kbps | Conservative Opus estimate |
| MP3 | 64 kbps | Conservative MP3 estimate |
| M4A | 64 kbps | Conservative AAC estimate |
| OGG | 64 kbps | Conservative Vorbis estimate |
| FLAC | 500 kbps | Conservative FLAC estimate |

## Validation Thresholds

- **Frontend**: Rejects if estimated > 25 seconds (conservative)
- **Backend**: Rejects if estimated > 30 seconds (hard limit)

This dual validation ensures we catch long files before attempting transcription.

## User Guidance

### For Users with Longer Audio Files

If you have audio longer than 30 seconds, you need to split it into shorter segments:

#### Using FFmpeg (Command Line)
```bash
# Split into 30-second segments
ffmpeg -i input.mp3 -f segment -segment_time 30 -c copy output_%03d.mp3

# Split with 1-second overlap to avoid cutting words
ffmpeg -i input.mp3 -f segment -segment_time 30 -segment_time_delta 1 output_%03d.mp3
```

#### Using Audacity (Desktop)
1. Open audio file in Audacity
2. Select a 30-second segment
3. File > Export > Export as WAV (or MP3)
4. Repeat for each segment

#### Using Online Tools
- AudioSplitter (https://audiosplitter.com/)
- MP3Cut (https://www.mp3cut.net/)
- 123Apps (https://www.123apps.com/audio-splitter/)

### Recommended Segment Size
- **Optimal**: 15-25 seconds per file
- **Maximum**: 30 seconds per file
- **Overlap**: Add 1-2 seconds overlap between segments if possible

## Testing

### Test with Short Audio
Files under 30 seconds should work normally:
- ✅ 10-second audio: Works
- ✅ 20-second audio: Works
- ✅ 30-second audio: Works

### Test with Long Audio
Files over 30 seconds will be rejected:
- ❌ 35-second audio: Rejected with clear error
- ❌ 1-minute audio: Rejected with clear error
- ❌ 5-minute audio: Rejected with clear error

## Error Messages

### Frontend Error (Toast)
```
Audio too long
Audio files must be 30 seconds or less. 
Your file is approximately 45 seconds. 
Please split it into shorter segments.
```

### Backend Error (API Response)
```json
{
  "error": "Audio file is too long. Maximum duration is 30 seconds, but your file is approximately 45 seconds. Please split your audio into shorter segments (30 seconds or less each)."
}
```

## File Size Guidelines

Based on 30-second limit, approximate maximum file sizes:

| Format | Max Bitrate | Max File Size (30s) |
|--------|-------------|---------------------|
| WAV | 1411 kbps | ~5.3 MB |
| WebM | 64 kbps | ~240 KB |
| MP3 | 64 kbps | ~240 KB |
| M4A | 64 kbps | ~240 KB |
| OGG | 64 kbps | ~240 KB |
| FLAC | 500 kbps | ~1.9 MB |

## Future Enhancements

If you need to support longer audio, consider:

1. **Automatic Segmentation**
   - Split long files automatically before transcription
   - Merge transcriptions after processing

2. **Batch Processing**
   - Process multiple segments in parallel
   - Combine results into single report

3. **Streaming ASR**
   - Use real-time streaming ASR services
   - No duration limits

4. **Different ASR Provider**
   - Switch to provider with longer limits
   - Use enterprise-grade ASR services

## Summary

- **Limit**: 30 seconds maximum per audio file
- **Action**: Split longer files into 30-second segments
- **Validation**: Both frontend and backend
- **Error Messages**: Clear and actionable
- **File Size**: Typically under 5.3 MB for WAV, under 240 KB for compressed formats
