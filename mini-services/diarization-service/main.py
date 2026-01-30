import os
import io
import base64
import logging
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from pyannote.audio import Pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Speaker Diarization Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
diarization_pipeline: Optional[Pipeline] = None

class DiarizationResult(BaseModel):
    segments: List[dict]
    speaker_count: int
    total_duration: float

class DiarizationSegment(BaseModel):
    start: float
    end: float
    speaker: str

async def get_pipeline() -> Pipeline:
    """Get or initialize the diarization pipeline."""
    global diarization_pipeline

    if diarization_pipeline is None:
        try:
            # Get HuggingFace token from environment
            hf_token = os.getenv("HUGGINGFACE_TOKEN")

            if not hf_token:
                logger.warning("HUGGINGFACE_TOKEN not set, using community pipeline without token")
                # Try to load without token (may have limited access)
                model_id = "pyannote/speaker-diarization-3.1"
            else:
                model_id = "pyannote/speaker-diarization-3.1"

            logger.info(f"Loading diarization pipeline: {model_id}")
            diarization_pipeline = Pipeline.from_pretrained(
                model_id,
                use_auth_token=hf_token
            )

            # Move to GPU if available
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            diarization_pipeline.to(device)
            logger.info(f"Pipeline loaded on device: {device}")

        except Exception as e:
            logger.error(f"Failed to load pipeline: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize diarization pipeline: {str(e)}"
            )

    return diarization_pipeline

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "pipeline_loaded": diarization_pipeline is not None}

@app.post("/diarize", response_model=DiarizationResult)
async def diarize_audio(
    audio: UploadFile = File(..., description="Audio file for diarization")
):
    """
    Perform speaker diarization on the uploaded audio file.

    Returns speaker segments with timestamps and speaker labels.
    """
    try:
        # Initialize pipeline if not already loaded
        pipeline = await get_pipeline()

        # Save uploaded file temporarily
        temp_file = f"/tmp/{audio.filename}"

        with open(temp_file, "wb") as f:
            content = await audio.read()
            f.write(content)

        logger.info(f"Processing audio file: {audio.filename} ({len(content)} bytes)")

        # Perform diarization
        diarization = pipeline(temp_file)

        # Convert results to structured format
        segments = []
        max_duration = 0.0

        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segment = {
                "start": float(turn.start),
                "end": float(turn.end),
                "duration": float(turn.duration),
                "speaker": str(speaker)
            }
            segments.append(segment)
            max_duration = max(max_duration, turn.end)

        # Get unique speakers
        speakers = set(seg["speaker"] for seg in segments)
        speaker_count = len(speakers)

        # Clean up temp file
        os.remove(temp_file)

        logger.info(f"Diarization complete: {speaker_count} speakers, {len(segments)} segments")

        return DiarizationResult(
            segments=segments,
            speaker_count=speaker_count,
            total_duration=max_duration
        )

    except Exception as e:
        logger.error(f"Diarization error: {e}")

        # Clean up temp file if it exists
        if 'temp_file' in locals() and os.path.exists(temp_file):
            os.remove(temp_file)

        raise HTTPException(
            status_code=500,
            detail=f"Diarization failed: {str(e)}"
        )

@app.post("/diarize-base64", response_model=DiarizationResult)
async def diarize_audio_base64(
    audio_base64: str = Form(..., description="Base64 encoded audio data"),
    format: str = Form("wav", description="Audio format (wav, mp3, etc.)")
):
    """
    Perform speaker diarization on base64 encoded audio data.

    Returns speaker segments with timestamps and speaker labels.
    """
    try:
        # Initialize pipeline if not already loaded
        pipeline = await get_pipeline()

        # Decode base64 audio
        audio_data = base64.b64decode(audio_base64)

        # Save to temporary file
        temp_file = f"/tmp/audio_{os.getpid()}.{format}"

        with open(temp_file, "wb") as f:
            f.write(audio_data)

        logger.info(f"Processing base64 audio ({len(audio_data)} bytes)")

        # Perform diarization
        diarization = pipeline(temp_file)

        # Convert results to structured format
        segments = []
        max_duration = 0.0

        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segment = {
                "start": float(turn.start),
                "end": float(turn.end),
                "duration": float(turn.duration),
                "speaker": str(speaker)
            }
            segments.append(segment)
            max_duration = max(max_duration, turn.end)

        # Get unique speakers
        speakers = set(seg["speaker"] for seg in segments)
        speaker_count = len(speakers)

        # Clean up temp file
        os.remove(temp_file)

        logger.info(f"Diarization complete: {speaker_count} speakers, {len(segments)} segments")

        return DiarizationResult(
            segments=segments,
            speaker_count=speaker_count,
            total_duration=max_duration
        )

    except Exception as e:
        logger.error(f"Diarization error: {e}")

        # Clean up temp file if it exists
        if 'temp_file' in locals() and os.path.exists(temp_file):
            os.remove(temp_file)

        raise HTTPException(
            status_code=500,
            detail=f"Diarization failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
