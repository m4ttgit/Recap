#!/bin/bash
# Audio Converter Service Startup Script

# Kill any existing converter service
pkill -f "converter.py" 2>/dev/null

# Set PYTHONPATH to find Flask
export PYTHONPATH=/home/z/.local/lib/python3.13/site-packages:$PYTHONPATH

# Start the audio converter service
nohup python3 /home/z/my-project/mini-services/audio-converter-service/converter.py > /tmp/audio-converter.log 2>&1 &

# Wait a moment for the service to start
sleep 2

# Check if service is running
if curl -s http://localhost:3004/health > /dev/null; then
    echo "✅ Audio Converter Service started successfully on port 3004"
else
    echo "❌ Failed to start Audio Converter Service"
    echo "Check logs: tail -f /tmp/audio-converter.log"
    exit 1
fi
