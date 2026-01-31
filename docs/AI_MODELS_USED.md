# AI Models Powering the Meeting Transcriber App

The Meeting Transcriber app uses multiple AI models to provide its functionality. Here's a complete breakdown:

---

## 1. Speech-to-Text (ASR) Model

### **Model**: z-ai-web-dev-sdk Built-in ASR
- **Provider**: z-ai-web-dev-sdk
- **Type**: Automatic Speech Recognition (ASR)
- **Implementation**: 
  ```typescript
  const zai = await ZAI.create()
  const response = await zai.audio.asr.create({
    file_base64: base64Audio
  })
  ```
- **Location**: `src/app/api/transcribe/route.ts:211-213`

### **What It Does**:
- Converts audio (WAV/WebM) to text
- Provides plain text transcription
- Returns word count and processing time

### **Limitations**:
- Only supports WAV and WebM formats directly
- Does not provide speaker diarization
- Does not provide word-level timestamps
- Model details are abstracted by the SDK (not publicly specified)

### **Supported Audio Formats**:
- WAV (direct support)
- WebM (direct support)
- Other formats (MP3, M4A, etc.) are converted to WAV first

---

## 2. Meeting Report Generation Model

### **Model**: GPT-4o-mini
- **Provider**: OpenAI (via z-ai-web-dev-sdk)
- **Type**: Large Language Model (LLM)
- **Implementation**:
  ```typescript
  const response = await zai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [...],
    temperature: 0.3
  })
  ```
- **Location**: `src/app/api/generate-report/route.ts:77-90`

### **What It Does**:
- Analyzes meeting transcriptions
- Generates structured reports in JSON format
- Extracts:
  - Summary of the meeting
  - Key discussion points
  - Action items with assignees and deadlines
  - Participants list
  - Meeting date

### **Parameters**:
- **Model**: `gpt-4o-mini`
- **Temperature**: `0.3` (lower temperature = more focused, deterministic outputs)
- **Output Format**: Structured JSON

### **Speaker-Aware Analysis**:
When diarization is enabled, the LLM receives speaker-labeled transcriptions (e.g., `[SPEAKER_00]: text`) and can:
- Track which speakers contributed to different topics
- Identify patterns in speaker contributions
- Better assign action items to specific speakers

---

## 3. Speaker Diarization Model

### **Model**: pyannote/speaker-diarization-3.1
- **Provider**: Hugging Face / pyannote.audio
- **Type**: Speaker Diarization / Speaker Segmentation
- **Implementation**:
  ```python
  diarization_pipeline = Pipeline.from_pretrained(
      "pyannote/speaker-diarization-3.1",
      use_auth_token=hf_token
  )
  ```
- **Location**: `mini-services/diarization-service/main.py:57-60`

### **What It Does**:
- Identifies and separates different speakers in audio
- Provides speaker labels (SPEAKER_00, SPEAKER_01, etc.)
- Generates timestamps for each speaker segment
- Counts the number of speakers

### **Features**:
- **Multi-speaker detection**: Can identify 2+ speakers
- **Timestamp segmentation**: Provides precise start/end times
- **Speaker embedding**: Uses neural speaker embeddings
- **Clustering**: Groups similar speech segments by speaker

### **Technical Details**:
- **Framework**: PyTorch
- **Library**: pyannote.audio
- **Model Version**: 3.1 (latest as of implementation)
- **Input**: Mono audio at 16kHz sample rate
- **Output**: Speaker-labeled segments with timestamps

### **Requirements**:
- HuggingFace access token
- Accepted user conditions for the model
- GPU recommended (falls back to CPU)

---

## 4. Audio Conversion

### **Tool**: FFmpeg (via @ffmpeg/ffmpeg WASM)
- **Type**: Audio Processing Tool
- **Implementation**:
  ```javascript
  await ffmpeg.exec([
    '-i', inputFileName,
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    '-y',
    outputFileName
  ])
  ```
- **Location**: `mini-services/audio-converter-service/index.js`

### **What It Does**:
- Converts various audio formats to WAV
- Optimizes audio for ASR:
  - 16kHz sample rate
  - Mono channel
  - PCM 16-bit codec

### **Note**: This is a tool, not an AI model, but it's crucial for making various audio formats compatible with the ASR model.

---

## Summary of AI Models

| Component | AI Model | Provider | Purpose |
|-----------|----------|----------|---------|
| **Speech-to-Text** | z-ai-web-dev-sdk ASR | z-ai-web-dev-sdk | Convert audio to text |
| **Report Generation** | GPT-4o-mini | OpenAI | Generate meeting summaries, action items |
| **Speaker Diarization** | pyannote/speaker-diarization-3.1 | Hugging Face | Identify and separate speakers |

---

## Model Information Details

### GPT-4o-mini
- **Release**: 2024
- **Type**: Multimodal (can process text, images, audio)
- **Size**: Smaller variant of GPT-4o
- **Strengths**: 
  - Fast and efficient
  - Good at structured output generation
  - Cost-effective
- **Use Case**: Analyzing transcriptions and generating structured JSON reports

### pyannote/speaker-diarization-3.1
- **Release**: 2024
- **Type**: Speaker diarization pipeline
- **Strengths**:
  - State-of-the-art performance
  - Handles overlapping speech
  - Works with various audio quality levels
- **Diarization Error Rate**: ~11-12% on benchmarks (lower is better)
- **Use Case**: Identifying who spoke when in meeting recordings

### z-ai-web-dev-sdk ASR
- **Model Details**: Abstracted by SDK
- **Supported Formats**: WAV, WebM
- **Capabilities**:
  - English speech recognition
  - Punctuation and capitalization
  - Word-level accuracy
- **Use Case**: Converting meeting audio to searchable text

---

## How the Models Work Together

```
┌─────────────────┐
│  Audio File     │
│  (MP3/M4A/WAV) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FFmpeg         │ ← Converts to WAV if needed
│ (Not AI)       │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────┐  ┌──────────────────┐
│ z-ai-web-dev │  │ pyannote.audio   │
│ SDK ASR       │  │ Diarization      │
│               │  │ Model 3.1       │
└──────┬───────┘  └────────┬─────────┘
       │                  │
       │ Transcription    │ Speaker Labels
       │                  │ + Timestamps
       └────────┬─────────┘
                │
                ▼
         ┌──────────────┐
         │ Merge Text   │
         │ + Speakers   │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ GPT-4o-mini  │ ← Generates report
         │ (OpenAI)     │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Meeting      │
         │ Report       │
         └──────────────┘
```

---

## Cost and Performance Considerations

### GPT-4o-mini
- **Cost**: Lower than full GPT-4o
- **Speed**: Fast response times
- **Quality**: High for structured tasks
- **Token Usage**: Depends on transcription length
  - Typical 5-minute meeting: ~800-1500 words
  - Estimated tokens: ~1000-2000 input + 500-800 output

### pyannote/speaker-diarization-3.1
- **Cost**: Free (open source)
- **Speed**: ~14-37 seconds per hour of audio (on GPU)
- **Hardware**: GPU recommended, CPU fallback available
- **Accuracy**: State-of-the-art for speaker diarization

### z-ai-web-dev-sdk ASR
- **Cost**: Included with SDK
- **Speed**: Fast (typically 2-5 seconds per minute of audio)
- **Accuracy**: Good for clear speech
- **Limitations**: Model details not publicly specified

---

## Potential Model Upgrades

### For Better ASR
- **NVIDIA Canary-Qwen-2.5B**: 5.63% WER (state-of-the-art)
- **Whisper Large v3**: OpenAI's latest model
- **Google Chirp**: Google's speech recognition model

### For Better Diarization
- **pyannote/speaker-diarization-precision-2**: Premium version with better accuracy
- **NVIDIA Riva**: Enterprise-grade speaker diarization

### For Better Reports
- **GPT-4o**: Full model for more complex analysis
- **Claude 3.5 Sonnet**: Alternative LLM with strong reasoning
- **Gemini Pro**: Google's LLM for multi-modal tasks

---

## Model Configuration

All model configurations are in the codebase:

### ASR Configuration
- **File**: `src/app/api/transcribe/route.ts`
- **Line**: 211-213
- **Config**: Uses default SDK settings

### LLM Configuration
- **File**: `src/app/api/generate-report/route.ts`
- **Line**: 78
- **Model**: `gpt-4o-mini`
- **Temperature**: `0.3`

### Diarization Configuration
- **File**: `mini-services/diarization-service/main.py`
- **Line**: 52-54
- **Model**: `pyannote/speaker-diarization-3.1`

---

## Conclusion

The Meeting Transcriber app uses a combination of three AI models:

1. **z-ai-web-dev-sdk ASR** - For speech-to-text transcription
2. **GPT-4o-mini** - For intelligent meeting report generation
3. **pyannote/speaker-diarization-3.1** - For speaker identification and segmentation

Each model serves a specific purpose and works together to provide a comprehensive meeting transcription and analysis solution.
