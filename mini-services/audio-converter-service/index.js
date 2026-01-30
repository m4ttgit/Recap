const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { FFmpeg } = require('@ffmpeg/ffmpeg');
const { fetchFile, toBlobURL } = require('@ffmpeg/util');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Initialize FFmpeg
let ffmpeg = null;

async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm',
          'application/wasm'
        ),
      });
    }
  }
  return ffmpeg;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audio-converter',
    version: '1.0.0'
  });
});

// Convert audio from base64
app.post('/convert-base64', async (req, res) => {
  try {
    const { audioData, inputFormat, outputFormat = 'wav' } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'audioData is required' });
    }

    console.log(`Converting ${inputFormat} to ${outputFormat}...`);

    // Initialize FFmpeg
    const ffmpegInstance = await initFFmpeg();

    // Create temporary files
    const inputFileName = `input_${Date.now()}.${inputFormat}`;
    const outputFileName = `output_${Date.now()}.${outputFormat}`;

    // Write input file
    const buffer = Buffer.from(audioData, 'base64');
    await ffmpegInstance.writeFile(inputFileName, buffer);

    // Convert audio
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-acodec', 'pcm_s16le', // PCM 16-bit for WAV
      '-ar', '16000', // 16kHz sample rate (optimal for ASR)
      '-ac', '1', // Mono channel
      '-y', // Overwrite output file
      outputFileName
    ]);

    // Read output file
    const outputData = await ffmpegInstance.readFile(outputFileName);
    const base64Output = Buffer.from(outputData).toString('base64');

    // Clean up
    try {
      await ffmpegInstance.deleteFile(inputFileName);
      await ffmpegInstance.deleteFile(outputFileName);
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    console.log(`Conversion successful: ${inputFormat} -> ${outputFormat}`);

    res.json({
      success: true,
      outputFormat,
      audioData: base64Output,
      size: outputData.length
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// Convert audio from file upload
app.post('/convert', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const inputFormat = path.extname(req.file.originalname).slice(1);
    const outputFormat = req.body.outputFormat || 'wav';

    console.log(`Converting ${inputFormat} to ${outputFormat} from file: ${req.file.originalname}`);

    // Read the uploaded file
    const audioData = fs.readFileSync(req.file.path);

    // Use the base64 conversion logic
    const base64Input = audioData.toString('base64');

    // Initialize FFmpeg
    const ffmpegInstance = await initFFmpeg();

    // Create temporary files
    const inputFileName = `input_${Date.now()}.${inputFormat}`;
    const outputFileName = `output_${Date.now()}.${outputFormat}`;

    // Write input file
    const buffer = Buffer.from(base64Input, 'base64');
    await ffmpegInstance.writeFile(inputFileName, buffer);

    // Convert audio with optimal settings for ASR
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-acodec', 'pcm_s16le', // PCM 16-bit for WAV
      '-ar', '16000', // 16kHz sample rate
      '-ac', '1', // Mono channel
      '-y', // Overwrite output file
      outputFileName
    ]);

    // Read output file
    const outputData = await ffmpegInstance.readFile(outputFileName);
    const base64Output = Buffer.from(outputData).toString('base64');

    // Clean up temp files
    try {
      await ffmpegInstance.deleteFile(inputFileName);
      await ffmpegInstance.deleteFile(outputFileName);
      fs.unlinkSync(req.file.path);
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    console.log(`Conversion successful: ${inputFormat} -> ${outputFormat}`);

    res.json({
      success: true,
      outputFormat,
      audioData: base64Output,
      size: outputData.length,
      originalFormat: inputFormat
    });

  } catch (error) {
    console.error('Conversion error:', error);

    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Audio Converter Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
