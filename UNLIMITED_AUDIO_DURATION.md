# Audio Duration Support - Unlimited (Up to 100MB)

## Summary
Audio duration is now **unlimited**! The only limitation is file size: **maximum 100MB**.

## What Changed

### Removed Limitations
- ❌ 30-second duration limit - **REMOVED**
- ❌ Duration validation - **REMOVED**
- ❌ Duration estimation - **REMOVED** (kept in code but not used for validation)

### Remaining Limitation
- ✅ File size limit: 100MB maximum

## Supported Audio Formats

All common audio formats are supported:
- ✅ WAV
- ✅ WebM
- ✅ MP3
- ✅ M4A
- ✅ OGG
- ✅ FLAC

## File Size Guidelines

| Format | Typical Bitrate | Max Duration (at 100MB) |
|--------|----------------|--------------------------|
| WAV | 1411 kbps | ~9.5 minutes |
| WebM | 64 kbps | ~3.5 hours |
| MP3 | 64 kbps | ~3.5 hours |
| M4A | 64 kbps | ~3.5 hours |
| OGG | 64 kbps | ~3.5 hours |
| FLAC | 500 kbps | ~27 minutes |

**Note**: Actual durations may vary based on audio quality and compression.

## User Experience

1. Upload any audio file up to 100MB
2. System automatically converts if needed (MP3, M4A, OGG, FLAC → WAV)
3. Transcription proceeds without duration restrictions
4. Get full transcription regardless of length

## Processing Time

Longer files will take longer to process:
- **Short files** (< 1 minute): ~5-10 seconds
- **Medium files** (1-5 minutes): ~10-30 seconds
- **Long files** (5-30 minutes): ~30-120 seconds
- **Very long files** (30+ minutes): ~2+ minutes

## Error Handling

### File Too Large
If file exceeds 100MB:
```
File too large
Please upload a file smaller than 100MB.
```

### ASR Service Errors
If the ASR service has its own limits (unlikely), the error will be from the service and will be displayed to the user.

## Recommendations

### For Best Results

1. **File Format**: WAV is recommended for best quality
2. **Audio Quality**: Clear speech with minimal background noise
3. **File Size**: Keep under 50MB for faster processing
4. **Speaker Separation**: Enable diarization for multi-speaker audio

### For Very Long Recordings

If you have recordings longer than 30 minutes:

1. **Consider splitting** for faster processing
2. **Use compressed formats** (MP3, WebM) to stay under 100MB
3. **High quality** recording improves transcription accuracy

### Optimal Audio Settings for Recording

If you're recording audio for transcription:

- **Sample Rate**: 16kHz or higher
- **Channels**: Mono (single channel is sufficient)
- **Bit Depth**: 16-bit or higher
- **Format**: WAV or high-quality MP3 (128 kbps or higher)
- **Environment**: Quiet room, minimal background noise

## Technical Details

### File Size Limit
- **Maximum**: 100MB
- **Reason**: Browser and server resource limits
- **Validation**: Checked before upload and processing

### Audio Conversion
- **Triggered**: Automatically for non-WAV/WebM files
- **Service**: Audio converter on port 3004
- **Output**: WAV (16kHz, mono, PCM 16-bit)
- **Processing Time**: ~1-3 seconds per minute of audio

### ASR Service
- **Duration Limit**: No limit imposed by our application
- **File Size Limit**: Handled by our 100MB limit
- **Processing**: Handled by z-ai-web-dev-sdk

## Migration from 30-Second Limit

If you previously split audio into 30-second segments:

1. You can now use the original full-length file
2. Upload the complete recording (up to 100MB)
3. Get one continuous transcription
4. Generate a single comprehensive report

## Benefits of Unlimited Duration

### For Users
- ✅ No need to split audio files
- ✅ Continuous transcription of full meetings
- ✅ Better context for AI report generation
- ✅ Simpler workflow

### For Transcription Quality
- ✅ Better context for the entire meeting
- ✅ More accurate speaker diarization
- ✅ Improved action item detection
- ✅ Coherent summaries

## Troubleshooting

### "File too large" Error
- Check file size (must be under 100MB)
- Compress audio if needed (use MP3 or WebM)
- Split very long recordings if needed

### "Conversion failed" Error
- Check audio converter service is running
- Try different file format
- Ensure file is valid and not corrupted

### "Transcription failed" Error
- Check ASR service status
- Verify audio quality (clear speech)
- Try shorter segment to isolate issue

## Summary

- **Duration Limit**: None (unlimited)
- **File Size Limit**: 100MB maximum
- **Supported Formats**: WAV, WebM, MP3, M4A, OGG, FLAC
- **Automatic Conversion**: Yes (for non-WAV/WebM)
- **Processing Time**: Scales with file size

**You can now upload and transcribe audio files of any duration up to 100MB!**
