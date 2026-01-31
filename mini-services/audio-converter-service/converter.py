#!/usr/bin/env python3
"""
Audio Converter Service using FFmpeg binary
Converts audio files to WAV format with optimal settings for ASR
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import subprocess
import tempfile
import os
import signal
import sys

app = Flask(__name__)
CORS(app)

PORT = 3004


def convert_audio_ffmpeg(audio_data, input_format):
    """
    Convert audio to WAV using FFmpeg binary
    Output: 16kHz, mono, PCM 16-bit (optimal for ASR)
    """
    try:
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix=f'.{input_format}', delete=False) as input_file:
            input_file.write(audio_data)
            input_path = input_file.name

        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as output_file:
            output_path = output_file.name

        # Run FFmpeg conversion
        # -ar 16000: 16kHz sample rate (optimal for speech recognition)
        # -ac 1: Mono channel
        # -acodec pcm_s16le: 16-bit PCM (standard WAV format)
        # -y: Overwrite output file
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-ar', '16000',
            '-ac', '1',
            '-acodec', 'pcm_s16le',
            '-y',
            output_path
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg conversion failed: {result.stderr}")

        # Read output file
        with open(output_path, 'rb') as f:
            output_bytes = f.read()

        # Clean up
        try:
            os.unlink(input_path)
            os.unlink(output_path)
        except:
            pass

        # Encode to base64
        base64_output = base64.b64encode(output_bytes).decode('utf-8')

        return base64_output, len(output_bytes)

    except subprocess.TimeoutExpired:
        # Clean up on timeout
        for path in [input_path, output_path]:
            try:
                os.unlink(path)
            except:
                pass
        raise Exception('Conversion timeout after 2 minutes')
    except Exception as e:
        # Clean up on error
        for path in [input_path, output_path]:
            try:
                os.unlink(path)
            except:
                pass
        raise e


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check if FFmpeg is available
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        ffmpeg_available = result.returncode == 0
    except:
        ffmpeg_available = False

    return jsonify({
        'status': 'healthy' if ffmpeg_available else 'degraded',
        'service': 'audio-converter',
        'version': '2.0.0',
        'ffmpeg_available': ffmpeg_available
    })


@app.route('/convert-base64', methods=['POST'])
def convert_base64():
    """Convert audio from base64 data"""
    try:
        data = request.get_json()

        audio_data = data.get('audioData')
        input_format = data.get('inputFormat', 'wav').lower()

        if not audio_data:
            return jsonify({'error': 'audioData is required'}), 400

        print(f"Converting {input_format} to WAV...")

        # Decode base64
        audio_bytes = base64.b64decode(audio_data)

        # Convert using FFmpeg
        base64_output, size = convert_audio_ffmpeg(audio_bytes, input_format)

        print(f"Conversion successful: {input_format} -> WAV ({size / 1024 / 1024:.2f}MB)")

        return jsonify({
            'success': True,
            'outputFormat': 'wav',
            'audioData': base64_output,
            'size': size
        })

    except Exception as e:
        print(f'Conversion error: {str(e)}')
        return jsonify({
            'error': 'Conversion failed',
            'message': str(e)
        }), 500


@app.route('/convert', methods=['POST'])
def convert_file():
    """Convert audio from uploaded file"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        file = request.files['audio']
        input_format = file.filename.split('.')[-1].lower()

        print(f"Converting {input_format} to WAV from file: {file.filename}")

        # Read file
        audio_bytes = file.read()

        # Convert using FFmpeg
        base64_output, size = convert_audio_ffmpeg(audio_bytes, input_format)

        print(f"Conversion successful: {input_format} -> WAV ({size / 1024 / 1024:.2f}MB)")

        return jsonify({
            'success': True,
            'outputFormat': 'wav',
            'audioData': base64_output,
            'size': size,
            'originalFormat': input_format
        })

    except Exception as e:
        print(f'Conversion error: {str(e)}')
        return jsonify({
            'error': 'Conversion failed',
            'message': str(e)
        }), 500


def signal_handler(sig, frame):
    """Handle shutdown gracefully"""
    print('\nShutting down Audio Converter Service...')
    sys.exit(0)


if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"Audio Converter Service starting on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print("Using FFmpeg binary for conversion")
    app.run(host='0.0.0.0', port=PORT, debug=False)
