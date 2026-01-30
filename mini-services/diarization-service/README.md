# Speaker Diarization Service

A Python FastAPI service for speaker diarization using pyannote.audio.

## Features

- **Speaker Diarization**: Automatically identifies and separates different speakers in audio recordings
- **Multiple Input Formats**: Supports base64 encoded audio and file uploads
- **REST API**: Simple REST endpoints for integration
- **Speaker Counting**: Automatically detects the number of speakers
- **Timestamp Segmentation**: Provides precise timestamps for each speaker segment

## Requirements

- Python 3.9+
- PyTorch
- pyannote.audio 3.1+
- HuggingFace access token (for pyannote models)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up HuggingFace token:
   - Get your token from https://hf.co/settings/tokens
   - Accept user conditions at https://huggingface.co/pyannote/speaker-diarization-3.1
   - Set environment variable:
     ```bash
     export HUGGINGFACE_TOKEN=your_token_here
     ```

## Usage

### Start the service

```bash
bun run dev
```

Or directly with Python:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 3002 --reload
```

### API Endpoints

#### Health Check
```
GET /health
```

#### Diarize Audio (Base64)
```
POST /diarize-base64
Content-Type: application/x-www-form-urlencoded

Parameters:
- audio_base64: Base64 encoded audio data
- format: Audio format (wav, mp3, etc.)

Response:
{
  "segments": [
    {
      "start": 0.2,
      "end": 1.5,
      "duration": 1.3,
      "speaker": "SPEAKER_00"
    }
  ],
  "speaker_count": 2,
  "total_duration": 10.5
}
```

#### Diarize Audio (File Upload)
```
POST /diarize
Content-Type: multipart/form-data

Parameters:
- audio: Audio file

Response: Same as /diarize-base64
```

## Integration with Next.js

The service is designed to work with the Next.js meeting transcriber app:

1. The diarization service runs on port 3002
2. Next.js app calls the service via `/api/transcribe` endpoint
3. Diarization results are merged with transcription text
4. Frontend displays speaker-labeled transcription

## Notes

- **HuggingFace Token Required**: You must accept the user conditions for pyannote/speaker-diarization-3.1 model
- **GPU Support**: The service automatically uses GPU if available (CUDA)
- **Audio Quality**: For best results, use clear audio with minimal background noise
- **Processing Time**: Diarization may take several seconds depending on audio length

## Troubleshooting

### "Failed to load pipeline"
- Ensure HUGGINGFACE_TOKEN is set
- Verify you've accepted the user conditions at HuggingFace
- Check internet connection for model download

### CUDA out of memory
- The service will automatically fall back to CPU if GPU is not available
- For large files, consider chunking the audio

### Poor diarization results
- Ensure audio is in mono format
- Check audio quality and background noise levels
- Verify the audio has clear speaker distinctions

## License

This service uses pyannote.audio which has its own licensing terms. Please refer to:
- https://github.com/pyannote/pyannote-audio
- https://huggingface.co/pyannote/speaker-diarization-3.1
