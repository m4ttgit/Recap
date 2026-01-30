# AI Provider Configuration Guide

## Overview

The Meeting Transcriber app now supports multiple AI providers for both speech recognition (ASR) and language model (LLM) tasks. You can configure your preferred providers through the Settings page.

## Supported Providers

### LLM Providers (for Meeting Reports)

#### 1. OpenAI
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **API Key**: Required for non-default selection
- **Use Case**: General-purpose report generation
- **Cost**: Pay-per-use via OpenAI API
- **Setup**: Get API key from https://platform.openai.com/api-keys

#### 2. Anthropic
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **API Key**: Required
- **Use Case**: Alternative to OpenAI with strong reasoning
- **Cost**: Pay-per-use via Anthropic API
- **Setup**: Get API key from https://console.anthropic.com/

#### 3. OpenRouter
- **Models**: Access to multiple models via unified API
  - OpenAI models (via OpenRouter)
  - Anthropic models (via OpenRouter)
  - Meta LLaMA, Mistral, and more
- **API Key**: Required
- **Base URL**: Optional (defaults to OpenRouter)
- **Use Case**: Access multiple providers through one API
- **Cost**: Pay-per-use via OpenRouter
- **Setup**: Get API key from https://openrouter.ai/keys

#### 4. Local Models
- **Models**: Self-hosted LLaMA, Mistral, custom models
- **API Key**: Not required
- **Use Case**: Privacy, cost control, custom fine-tunes
- **Cost**: Free (self-hosted)
- **Setup**: Requires local inference server (Ollama, vLLM, etc.)

### ASR Providers (for Speech-to-Text)

#### 1. Z.ai SDK (Default)
- **Models**: Built-in ASR model
- **API Key**: Not required
- **Use Case**: Default option, no setup needed
- **Cost**: Included with z-ai-web-dev-sdk

#### 2. OpenRouter (Coming Soon)
- **Models**: Multiple ASR models via OpenRouter
- **API Key**: Required
- **Use Case**: Access to state-of-the-art ASR models
- **Setup**: Get API key from https://openrouter.ai/keys

#### 3. Local Models (Coming Soon)
- **Models**: Whisper, Canary-Qwen, etc.
- **API Key**: Not required
- **Use Case**: Privacy, cost control
- **Setup**: Requires local inference server

## Configuration Steps

### 1. Access Settings Page

Navigate to: **http://localhost:3000/settings**

### 2. Configure LLM Provider

#### For OpenAI:
1. Select "OpenAI" from LLM Provider dropdown
2. Choose your preferred model (GPT-4o Mini recommended)
3. No API key needed for default (uses z-ai-web-dev-sdk)
4. Click "Save Settings"

#### For Anthropic:
1. Select "Anthropic" from LLM Provider dropdown
2. Choose your preferred model
3. Enter your Anthropic API key
4. Click "Save Settings"

#### For OpenRouter:
1. Select "OpenRouter" from LLM Provider dropdown
2. Choose your preferred model
3. Enter your OpenRouter API key
4. Optionally enter custom Base URL
5. Click "Save Settings"

#### For Local Models:
1. Select "Local Model" from LLM Provider dropdown
2. Choose or enter your model name
3. No API key needed
4. Click "Save Settings"

### 3. Configure ASR Provider

Currently, only Z.ai SDK is fully implemented:
1. Select "Z.ai SDK (Default)" from ASR Provider dropdown
2. No additional configuration needed

OpenRouter and Local options are available for future implementation.

### 4. Configure Diarization

1. Toggle "Enable Speaker Diarization" on/off
2. Select "Pyannote" as the provider (only option currently)
3. Click "Save Settings"

Note: Diarization requires the Python diarization service to be running.

## Using Different Providers

### OpenAI Example

**Settings Configuration:**
- LLM Provider: OpenAI
- LLM Model: GPT-4o Mini
- API Key: `sk-...` (optional, uses SDK default)

**How it Works:**
```typescript
const zai = await ZAI.create()
const response = await zai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...]
})
```

### Anthropic Example

**Settings Configuration:**
- LLM Provider: Anthropic
- LLM Model: Claude 3.5 Sonnet
- API Key: `sk-ant-...`

**How it Works:**
The app would use the z-ai-web-dev-sdk's OpenAI integration. For full Anthropic support, additional SDK integration would be needed.

### OpenRouter Example

**Settings Configuration:**
- LLM Provider: OpenRouter
- LLM Model: `openai/gpt-4o-mini` or `anthropic/claude-3.5-sonnet`
- API Key: `sk-or-...`
- Base URL: `https://openrouter.ai/api/v1` (optional)

**How it Works:**
OpenRouter provides a unified API for multiple models. The base URL and API key are used to make requests.

### Local Models Example

**Settings Configuration:**
- LLM Provider: Local Model
- LLM Model: `llama-3.1-70b` or `custom`
- API Key: Not required

**How it Works:**
For local models, you need to:
1. Run an inference server (Ollama, vLLM, etc.)
2. Configure it to expose an OpenAI-compatible API
3. Use that as the base URL in settings

**Example with Ollama:**
```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.1:70b

# Use in settings:
# LLM Provider: Local Model
# LLM Model: llama-3.1-70b
# Base URL: http://localhost:11434/v1 (if Ollama exposes OpenAI-compatible API)
```

## API Key Security

- **Storage**: API keys are stored in the database
- **Encryption**: Keys should be encrypted in production
- **Exposure**: Keys are never exposed in API responses
- **Usage**: Keys are only sent to their respective APIs

## Database Schema

### Settings Table
```sql
CREATE TABLE Settings (
  id TEXT PRIMARY KEY,
  asrProvider TEXT DEFAULT 'zai-sdk',
  asrModel TEXT,
  llmProvider TEXT DEFAULT 'openai',
  llmModel TEXT DEFAULT 'gpt-4o-mini',
  llmApiKey TEXT,
  llmBaseURL TEXT,
  diarizationEnabled BOOLEAN DEFAULT true,
  diarizationProvider TEXT DEFAULT 'pyannote',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Transcription Table
```sql
CREATE TABLE Transcription (
  id TEXT PRIMARY KEY,
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  duration REAL,
  wordCount INTEGER NOT NULL,
  transcription TEXT NOT NULL,
  asrProvider TEXT NOT NULL,
  asrModel TEXT,
  formatConverted BOOLEAN DEFAULT false,
  originalFormat TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### MeetingReport Table
```sql
CREATE TABLE MeetingReport (
  id TEXT PRIMARY KEY,
  transcriptionId TEXT,
  summary TEXT NOT NULL,
  keyPoints TEXT NOT NULL, -- JSON array
  actionItems TEXT NOT NULL, -- JSON array
  participants TEXT NOT NULL, -- JSON array
  date TEXT NOT NULL,
  llmProvider TEXT NOT NULL,
  llmModel TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Current Limitations

### LLM Providers
- **OpenAI**: ✅ Fully supported (via z-ai-web-dev-sdk)
- **Anthropic**: ⚠️ Partially supported (needs SDK integration)
- **OpenRouter**: ⚠️ Partially supported (needs custom API client)
- **Local Models**: ⚠️ Needs custom inference server and API client

### ASR Providers
- **Z.ai SDK**: ✅ Fully supported (default)
- **OpenRouter**: 🚧 Coming soon
- **Local Models**: 🚧 Coming soon

## Future Enhancements

### Planned Features
1. Full OpenRouter integration with custom API client
2. Anthropic SDK integration
3. Local model support with Ollama/vLLM
4. Provider-specific model catalogs
5. API key encryption at rest
6. Usage cost tracking per provider
7. Model performance comparison
8. A/B testing between models

### Provider-Specific Features

#### OpenRouter
- Access to 100+ models
- Unified billing
- Model ranking and recommendations

#### Local Models
- Ollama integration
- vLLM support
- Custom fine-tuned models
- Zero API costs

#### Anthropic
- Claude 3.5 Sonnet integration
- Custom system prompts
- Token usage tracking

## Troubleshooting

### Issue: "Invalid API key" Error
**Solution**: 
- Verify API key is correct
- Check API key has required permissions
- Ensure account has active subscription

### Issue: "Model not found" Error
**Solution**:
- Verify model name is correct for the provider
- Check model is available in your region
- For OpenRouter, check model availability

### Issue: Local model not working
**Solution**:
- Ensure inference server is running
- Check server is exposing OpenAI-compatible API
- Verify base URL is correct
- Check server logs for errors

### Issue: Settings not saving
**Solution**:
- Check database is accessible
- Verify file permissions on database file
- Check browser console for errors

## Best Practices

### API Keys
- Never commit API keys to version control
- Use environment variables in production
- Rotate keys regularly
- Use different keys for development and production
- Monitor API key usage for unauthorized access

### Model Selection
- Use smaller models (GPT-4o Mini) for faster, cheaper processing
- Use larger models (GPT-4o, Claude 3 Opus) for complex analysis
- Test with different models to find best fit for your use case
- Consider cost vs. performance trade-offs

### Local Models
- Ensure sufficient hardware (GPU recommended)
- Monitor resource usage
- Implement proper error handling
- Consider serving via API for scalability

## Cost Considerations

### OpenAI Pricing (Approximate)
- GPT-4o Mini: ~$0.15 per 1M input tokens
- GPT-4o: ~$2.50 per 1M input tokens
- GPT-4 Turbo: ~$10.00 per 1M input tokens

### Anthropic Pricing (Approximate)
- Claude 3 Haiku: ~$0.25 per 1M input tokens
- Claude 3.5 Sonnet: ~$3.00 per 1M input tokens
- Claude 3 Opus: ~$15.00 per 1M input tokens

### OpenRouter Pricing
- Varies by model and provider
- Often cheaper than direct API
- Unified billing across providers

### Local Models
- Free (self-hosted)
- Hardware costs (GPU, electricity)
- Maintenance overhead
- No per-request costs

## API Reference

### GET /api/settings
Retrieve current settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "asrProvider": "zai-sdk",
    "llmProvider": "openai",
    "llmModel": "gpt-4o-mini",
    "diarizationEnabled": true,
    "diarizationProvider": "pyannote"
  }
}
```

### PUT /api/settings
Update settings.

**Request:**
```json
{
  "llmProvider": "anthropic",
  "llmModel": "claude-3-5-sonnet",
  "llmApiKey": "sk-ant-..."
}
```

**Response:**
```json
{
  "success": true,
  "settings": {...},
  "message": "Settings updated successfully"
}
```

### GET /api/dashboard
Retrieve usage statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTranscriptions": 10,
    "totalReports": 8,
    "totalWords": 1500,
    "totalAudioSize": 52428800
  },
  "recent": {...},
  "settings": {...}
}
```

## Related Documentation

- `docs/AI_MODELS_USED.md` - Information about AI models
- `docs/SPEAKER_DIARIZATION_GUIDE.md` - Diarization setup
- `docs/AUDIO_CONVERSION_GUIDE.md` - Audio format conversion

---

**Status**: ✅ Ready for use (with provider-specific limitations)

**Last Updated**: 2025-01-XX

**Version**: 1.0.0
