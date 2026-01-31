#!/bin/bash

# Setup script for diarization service

echo "Setting up Speaker Diarization Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Python version: $PYTHON_VERSION"

# Install dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Get your HuggingFace token from: https://hf.co/settings/tokens"
    echo "2. Accept user conditions at: https://huggingface.co/pyannote/speaker-diarization-3.1"
    echo "3. Set environment variable: export HUGGINGFACE_TOKEN=your_token_here"
    echo "4. Start the service: bun run dev"
    echo ""
else
    echo ""
    echo "✗ Installation failed. Please check the error messages above."
    exit 1
fi
