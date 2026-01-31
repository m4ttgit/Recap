#!/usr/bin/env python3
"""
Audio Converter Service
Converts audio files between different formats using pydub
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import os
import tempfile
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)

PORT = 3004


def convert_audio(audio_data, input_format, output_format='wav'):
    """
    Convert audio data between formats
    """
    try:
        # Decode base64 input
        audio_bytes = base64.b64decode(audio_data)

        # Create AudioSegment from bytes
        with tempfile.NamedTemporaryFile(suffix=f'.{input_format}', delete=False) as input_file:
            input_file.write(audio_bytes)
            input_path = input_file.name

        # Load audio based on format
        if input_format.lower() in ['mp3', 'm4a', 'aac', 'ogg', 'flac', 'wav', 'webm']:
            audio = AudioSegment.from_file(input_path, format=input_format.lower())
        else:
            os.unlink(input_path)
            raise ValueError(f"Unsupported input format: {input_format}")

        # Convert to output format with optimal settings for ASR
        if output_format.lower() == 'wav':
            # Optimize for speech recognition: 16kHz, mono, PCM 16-bit
            audio = audio.set_frame_rate(16000)
            audio = audio.set_channels(1)

            # Export to bytes
            with io.BytesIO() as output_buffer:
                audio.export(output_buffer, format='wav')
                output_bytes = output_buffer.getvalue()
        else:
            os.unlink(input_path)
            raise ValueError(f"Unsupported output format: {output_format}")

        # Clean up input file
        os.unlink(input_path)

        # Encode to base64
        base64_output = base64.b64encode(output_bytes).decode('utf-8')

        return base64_output, len(output_bytes)

    except Exception as e:
        # Clean up on error
        if 'input_path' in locals() and os.path.exists(input_path):
            os.unlink(input_path)
        raise e


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'audio-converter',
        'version': '1.0.0'
    })


@app.route('/convert-base64', methods=['POST'])
def convert_base64():
    """Convert audio from base64 data"""
    try:
        data = request.get_json()

        audio_data = data.get('audioData')
        input_format = data.get('inputFormat', 'wav')
        output_format = data.get('outputFormat', 'wav')

        if not audio_data:
            return jsonify({'error': 'audioData is required'}), 400

        print(f"Converting {input_format} to {output_format}...")

        # Convert audio
        base64_output, size = convert_audio(audio_data, input_format, output_format)

        print(f"Conversion successful: {input_format} -> {output_format} ({size / 1024 / 1024:.2f}MB)")

        return jsonify({
            'success': True,
            'outputFormat': output_format,
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
        input_format = file.filename.split('.')[-1]
        output_format = request.form.get('outputFormat', 'wav')

        print(f"Converting {input_format} to {output_format} from file: {file.filename}")

        # Read file and convert to base64
        audio_bytes = file.read()
        audio_data = base64.b64encode(audio_bytes).decode('utf-8')

        # Convert audio
        base64_output, size = convert_audio(audio_data, input_format, output_format)

        print(f"Conversion successful: {input_format} -> {outputFormat} ({size / 1024 / 1024:.2f}MB)")

        return jsonify({
            'success': True,
            'outputFormat': output_format,
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


if __name__ == '__main__':
    print(f"Audio Converter Service starting on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    app.run(host='0.0.0.0', port=PORT, debug=True)
