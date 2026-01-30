# Audio Duration Support - Current Status

## Important Note

While our application **supports unlimited audio duration up to 100MB**, the **current ASR service (z-ai-web-dev-sdk) has a 30-second limitation**.

## What We've Done

### ✅ Application Level (No Duration Limit)
- Removed all duration validation from our code
- Only file size limit (100MB) remains
- Accepts audio files of any length (under 100MB)
- All formats supported: WAV, WebM, MP3, M4A, OGG, FLAC

### ⚠️ ASR Service Level (30-Second Limit)
- The z-ai-web-dev-sdk ASR service currently limits audio to 30 seconds
- This is a service limitation, not our application limitation
- Error: "transcriptions文件时长限制为0-30秒"

## Current Behavior

### For Audio Files ≤ 30 Seconds
✅ **Works perfectly**
- Upload any supported format
- Automatic conversion if needed
- Full transcription
- Speaker diarization (if enabled)
- Meeting report generation

### For Audio Files > 30 Seconds
❌ **ASR Service Error**
- Application accepts the file
- Conversion works (if needed)
- But ASR service returns error
- Clear error message now shown

## Improved Error Message

When audio exceeds 30 seconds, users now see:
```
The current ASR service has a 30-second duration limit. 
Please either: 
1) Use a shorter audio file (30 seconds or less), or 
2) Configure a different ASR provider in Settings that supports longer audio files.

You can change the ASR provider in the Settings page.
```

## Solutions for Users with Longer Audio

### Option 1: Use Shorter Segments (Current)
Split your audio into 30-second segments:
- Use FFmpeg: `ffmpeg -i input.mp3 -f segment -segment_time 30 output_%03d.mp3`
- Use Audacity to manually split
- Use online tools like AudioSplitter

### Option 2: Configure Different ASR Provider (Future)
The Settings page allows you to configure different ASR providers:
- OpenRouter (access to multiple ASR models)
- Local models (self-hosted)
- Other providers that may support longer audio

### Option 3: Wait for ASR Service Update
The z-ai-web-dev-sdk may add support for longer audio in future updates.

## File Size vs Duration

At 100MB maximum file size:

| Format | Bitrate | Max Duration | Practical Use |
|--------|---------|--------------|---------------|
| WAV | 1411 kbps | ~9.5 minutes | Short meetings |
| WebM | 64 kbps | ~3.5 hours | Long recordings |
| MP3 | 64 kbps | ~3.5 hours | Long recordings |
| M4A | 64 kbps | ~3.5 hours | Long recordings |
| OGG | 64 kbps | ~3.5 hours | Long recordings |
| FLAC | 500 kbps | ~27 minutes | Medium recordings |

**Note**: Even though our app can handle long files, the current ASR service limits to 30 seconds.

## Current Supported Scenarios

### ✅ Works (≤ 30 seconds)
- Short voice memos
- Quick meeting snippets
- Voice messages
- Test audio clips
- Demo recordings

### ⚠️ Limited by ASR (> 30 seconds)
- Full meeting recordings (must split)
- Long interviews (must split)
- Podcasts (must split)
- Lectures (must split)

## Technical Details

### Application Limits
- **Duration**: None (unlimited)
- **File Size**: 100MB maximum
- **Formats**: WAV, WebM, MP3, M4A, OGG, FLAC

### ASR Service Limits
- **Duration**: 30 seconds maximum
- **File Size**: Handled by our 100MB limit
- **Provider**: z-ai-web-dev-sdk (default)

### Error Handling
```typescript
// Our code catches the ASR service error and provides clear guidance
if (asrError.message && asrError.message.includes('30秒')) {
  return NextResponse.json({
    error: 'The current ASR service has a 30-second duration limit...',
    code: 'DURATION_LIMIT',
    suggestion: 'Try a shorter audio file or configure a different ASR provider'
  })
}
```

## Future Possibilities

### To Support Longer Audio:

1. **Switch ASR Provider**
   - Configure OpenRouter in Settings
   - Use local Whisper model (unlimited duration)
   - Use other ASR APIs with longer limits

2. **Implement Audio Segmentation**
   - Automatically split long files
   - Transcribe each segment
   - Merge results

3. **Use Different SDK**
   - Direct Whisper API integration
   - Other ASR services
   - Custom ASR implementation

## User Guidance

### For Best Results Now:
1. **Keep audio under 30 seconds** for current ASR service
2. **Use WAV format** for highest quality
3. **Clear audio** with minimal noise
4. **Single speaker** works best (disable diarization)

### For Longer Audio:
1. **Split into 30-second segments**
2. **Transcribe each segment**
3. **Manually combine results**
4. **Generate report from combined transcription**

## Summary

- **Our App**: ✅ Supports unlimited duration (up to 100MB)
- **Current ASR**: ⚠️ Limited to 30 seconds
- **Future**: Can be configured to use different ASR providers
- **Solution**: Use 30-second segments now, configure different ASR later

**The application is ready to support unlimited audio duration. You just need to configure an ASR provider that supports longer audio in the Settings page.**
