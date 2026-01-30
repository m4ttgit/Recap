import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Diarization service configuration
const DIARIZATION_SERVICE_URL = process.env.DIARIZATION_SERVICE_URL || 'http://localhost:3002'

// Audio converter service configuration
const CONVERTER_SERVICE_URL = process.env.CONVERTER_SERVICE_URL || 'http://localhost:3004'

// ASR service limits
const MAX_AUDIO_DURATION_SECONDS = 30
const MAX_FILE_SIZE_MB = 100

interface DiarizationSegment {
  start: number
  end: number
  duration: number
  speaker: string
}

interface DiarizationResult {
  segments: DiarizationSegment[]
  speaker_count: number
  total_duration: number
}

interface ConverterResponse {
  success: boolean
  outputFormat: string
  audioData: string
  size: number
  originalFormat?: string
}

// Supported formats that don't need conversion
const SUPPORTED_FORMATS = ['wav', 'webm']

// Estimated bitrates for common formats (in kbps)
const ESTIMATED_BITRATES: Record<string, number> = {
  wav: 1411,  // 16kHz, mono, 16-bit PCM
  webm: 64,   // Conservative estimate for Opus
  mp3: 64,    // Conservative estimate for MP3
  m4a: 64,    // Conservative estimate for AAC
  ogg: 64,    // Conservative estimate for Vorbis
  flac: 500   // Conservative estimate for FLAC
}

// Estimate audio duration from file size and format
function estimateDuration(fileSizeBytes: number, format: string): number {
  const bitrate = ESTIMATED_BITRATES[format] || 128 // Default to 128 kbps
  const fileSizeKbps = fileSizeBytes * 8 / 1000 // Convert bytes to kilobits
  const durationSeconds = fileSizeKbps / bitrate
  return durationSeconds
}

// Format duration in human-readable form
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

// Detect audio format from file name or MIME type
function detectAudioFormat(fileName: string, mimeType?: string): string {
  // Try MIME type first
  if (mimeType) {
    const mimeToFormat: Record<string, string> = {
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac'
    }
    if (mimeToFormat[mimeType]) {
      return mimeToFormat[mimeType]
    }
  }

  // Fall back to file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'wav'
  return ext
}

// Convert audio to WAV format if needed
async function convertToWav(base64Audio: string, inputFormat: string): Promise<string> {
  try {
    console.log(`Converting ${inputFormat} to WAV...`)
    console.log(`Converter service URL: ${CONVERTER_SERVICE_URL}`)

    // First check if converter service is available
    try {
      const healthCheck = await fetch(`${CONVERTER_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!healthCheck.ok) {
        throw new Error('Converter service is not responding')
      }
      
      const healthData = await healthCheck.json()
      console.log('Converter service health:', healthData)
    } catch (healthError) {
      console.error('Converter service health check failed:', healthError)
      throw new Error('Audio converter service is not running. Please start it with: cd mini-services/audio-converter-service && npm install && npm run dev')
    }

    const response = await fetch(`${CONVERTER_SERVICE_URL}/convert-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioData: base64Audio,
        inputFormat: inputFormat,
        outputFormat: 'wav'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Conversion failed')
    }

    const data: ConverterResponse = await response.json()
    console.log(`Conversion successful: ${inputFormat} -> WAV (${(data.size / 1024 / 1024).toFixed(2)}MB)`)

    return data.audioData
  } catch (error) {
    console.error('Audio conversion error:', error)
    throw new Error(`Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function performDiarization(base64Audio: string, fileName: string): Promise<DiarizationResult | null> {
  try {
    const response = await fetch(`${DIARIZATION_SERVICE_URL}/diarize-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        audio_base64: base64Audio,
        format: fileName.split('.').pop() || 'wav'
      })
    })

    if (!response.ok) {
      console.warn('Diarization service unavailable:', response.status)
      return null
    }

    const data = await response.json()
    return data as DiarizationResult
  } catch (error) {
    console.warn('Diarization failed:', error)
    return null
  }
}

function mergeTranscriptionWithDiarization(
  transcription: string,
  diarization: DiarizationResult
): Array<{ text: string; speaker: string; start: number; end: number }> {
  // Simple approach: split transcription by sentence and assign based on time
  // In production, you'd want word-level timestamps from the ASR model

  const sentences = transcription.match(/[^.!?]+[.!?]+/g) || [transcription]
  const segments: Array<{ text: string; speaker: string; start: number; end: number }> = []

  // Distribute sentences across diarization segments
  let sentenceIndex = 0
  const totalDuration = diarization.total_duration || 1

  for (const segment of diarization.segments) {
    if (sentenceIndex >= sentences.length) break

    const text = sentences[sentenceIndex].trim()
    if (text) {
      segments.push({
        text,
        speaker: segment.speaker,
        start: segment.start,
        end: segment.end
      })
    }
    sentenceIndex++
  }

  // Add any remaining sentences
  while (sentenceIndex < sentences.length) {
    const text = sentences[sentenceIndex].trim()
    if (text) {
      segments.push({
        text,
        speaker: 'UNKNOWN',
        start: totalDuration,
        end: totalDuration
      })
    }
    sentenceIndex++
  }

  return segments
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const enableDiarization = formData.get('enableDiarization') === 'true'

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer and then to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let base64Audio = buffer.toString('base64')

    // Get file size for metadata
    const fileSize = buffer.length
    const fileSizeMB = fileSize / (1024 * 1024)

    // Validate file size
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      )
    }

    // Detect audio format
    const inputFormat = detectAudioFormat(audioFile.name, audioFile.type)
    console.log(`Detected audio format: ${inputFormat}`)

    // Note: Duration validation removed to support unlimited audio up to 100MB
    // The ASR service may have its own limits, but we let it handle those

    // Convert to WAV if not already in supported format
    let wasConverted = false
    if (!SUPPORTED_FORMATS.includes(inputFormat)) {
      console.log(`Audio format ${inputFormat} not directly supported, converting to WAV...`)
      base64Audio = await convertToWav(base64Audio, inputFormat)
      wasConverted = true
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Transcribe audio
    const startTime = Date.now()
    let response
    try {
      response = await zai.audio.asr.create({
        file_base64: base64Audio
      })
    } catch (asrError: any) {
      console.error('ASR service error:', asrError)
      
      // Check if it's the 30-second limit error
      if (asrError.message && asrError.message.includes('30秒')) {
        return NextResponse.json(
          {
            error: 'The current ASR service has a 30-second duration limit. Please either: 1) Use a shorter audio file (30 seconds or less), or 2) Configure a different ASR provider in Settings that supports longer audio files. You can change the ASR provider in the Settings page.',
            code: 'DURATION_LIMIT',
            currentLimit: '30 seconds',
            suggestion: 'Try a shorter audio file or configure a different ASR provider'
          },
          { status: 400 }
        )
      }
      
      throw asrError
    }
    const endTime = Date.now()

    if (!response.text || response.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty transcription result. The audio may not contain clear speech.' },
        { status: 500 }
      )
    }

    const wordCount = response.text.split(/\s+/).length
    const processingTime = endTime - startTime

    // Perform diarization if enabled (use original audio for diarization)
    let diarizationResult: DiarizationResult | null = null
    let speakerSegments: Array<{ text: string; speaker: string; start: number; end: number }> | null = null

    if (enableDiarization) {
      console.log('Performing speaker diarization...')
      // Use the original base64 audio (before conversion) for diarization if possible,
      // otherwise use the converted WAV
      const audioForDiarization = wasConverted ? await convertToWav(base64Audio, 'wav') : base64Audio
      diarizationResult = await performDiarization(audioForDiarization, audioFile.name)

      if (diarizationResult && diarizationResult.segments.length > 0) {
        speakerSegments = mergeTranscriptionWithDiarization(response.text, diarizationResult)
        console.log(`Diarization complete: ${diarizationResult.speaker_count} speakers detected`)
      }
    }

    // Get current settings for provider info
    const settings = await db.settings.findFirst()

    // Save transcription to database
    await db.transcription.create({
      data: {
        fileName: audioFile.name,
        fileSize: fileSize,
        duration: diarizationResult?.total_duration || null,
        wordCount: wordCount,
        transcription: response.text,
        asrProvider: settings?.asrProvider || 'zai-sdk',
        asrModel: settings?.asrModel || null,
        formatConverted: wasConverted,
        originalFormat: wasConverted ? inputFormat : null
      }
    })

    return NextResponse.json({
      success: true,
      transcription: response.text,
      wordCount,
      processingTime,
      fileName: audioFile.name,
      fileSize,
      timestamp: new Date().toISOString(),
      formatConverted: wasConverted,
      originalFormat: wasConverted ? inputFormat : undefined,
      diarization: diarizationResult ? {
        enabled: true,
        speakerCount: diarizationResult.speaker_count,
        totalDuration: diarizationResult.total_duration,
        segments: speakerSegments
      } : {
        enabled: false,
        speakerCount: 0,
        totalDuration: 0,
        segments: null
      }
    })
  } catch (error) {
    console.error('Transcription error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Transcription failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
