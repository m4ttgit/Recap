# Custom Model Name Feature

## Overview
Added the ability to input custom model names when "Custom Model" is selected for both ASR (Speech Recognition) and LLM (Language Model) providers in the settings page.

## Changes Made

### 1. Frontend (`/home/z/my-project/src/app/settings/page.tsx`)

#### Updated Interface
Added two new optional fields to the `SettingsData` interface:
- `customAsrModel?: string | null` - Custom model name for ASR
- `customLlmModel?: string | null` - Custom model name for LLM

#### Added ASR Model Selection
- Created `ASR_MODELS` constant with predefined models for each provider:
  - **Z.ai SDK**: Default Model
  - **OpenRouter**: Whisper Large V3, NVIDIA Canary 1B, Custom Model
  - **Local**: Whisper Base, Small, Medium, Large V3, Custom Model

- Updated ASR Provider selection to automatically set the first model when provider changes
- Added dropdown for ASR model selection when provider is not "zai-sdk"
- Added conditional input field for custom ASR model name that appears when "Custom Model" is selected

#### Enhanced LLM Custom Model Input
- Updated the custom model input to use the correct field name (`customLlmModel`)
- Fixed binding to use `settings.customLlmModel` instead of `settings.asrModel`

### 2. Database Schema (`/home/z/my-project/prisma/schema.prisma`)

#### Updated Settings Model
Added two new columns to the `Settings` table:
```prisma
customAsrModel    String?  // Custom model name for ASR
customLlmModel    String?  // Custom model name for LLM
```

### 3. Database Migration
Ran `bun run db:push` to apply schema changes to the SQLite database.

## Features

### ASR Custom Model
When user selects:
1. **OpenRouter** or **Local** as ASR provider
2. **Custom Model** from the ASR Model dropdown

A new input field appears:
- Label: "Custom Model Name" (with Zap icon)
- Placeholder: "e.g., whisper-large-v3-turbo, canary-1b, distil-whisper-large-v3"
- Help text: Explains to enter the exact model name from the ASR provider
- Mention of `ollama list` command for Ollama users

### LLM Custom Model
When user selects:
1. **Local** as LLM provider
2. **Custom Model** from the LLM Model dropdown

A new input field appears:
- Label: "Custom Model Name" (with Server icon)
- Placeholder: "e.g., ollama/llama3.2:latest, mistral-7b-instruct"
- Help text: Explains to enter the exact model name from Ollama
- Examples: `ollama/llama3.2:latest` or `llama3.2:latest`

## Use Cases

### For Ollama Users
1. Install and run Ollama locally
2. Pull desired models: `ollama pull llama3.2`
3. List available models: `ollama list`
4. Go to Settings page
5. Select "Local Model" as provider
6. Select "Custom Model" from model dropdown
7. Enter the exact model name from `ollama list` output

### For Other Local Providers
Users can input any custom model name that their local inference server supports, including:
- Whisper variants for ASR
- LLaMA, Mistral, or other LLMs for report generation

## Code Quality
- ✅ All ESLint checks pass
- ✅ TypeScript types are properly defined
- ✅ Database schema is synced
- ✅ Dev server runs without errors
- ✅ Settings API works correctly

## Testing
To test the custom model feature:
1. Navigate to `/settings` in the app
2. Select "Local Model" for ASR Provider
3. Select "Custom Model" from ASR Model dropdown
4. Enter a custom model name (e.g., "whisper-large-v3-turbo")
5. Select "Local Model" for LLM Provider
6. Select "Custom Model" from LLM Model dropdown
7. Enter a custom model name (e.g., "ollama/llama3.2:latest")
8. Click "Save Settings"
9. Verify settings persist after page refresh

## Next Steps
The backend APIs (`/api/transcribe` and `/api/generate-report`) can be updated to:
1. Read the custom model fields from settings
2. Use `customAsrModel` when `asrModel === 'custom'`
3. Use `customLlmModel` when `llmModel === 'custom'`
4. Handle actual API calls to custom models

## Notes
- The custom model names are stored in the database as optional string fields
- Frontend validation should be added in the future to ensure custom model names are not empty when "Custom Model" is selected
- The UI provides helpful placeholders and examples to guide users
- Both ASR and LLM custom model inputs are consistent in design and UX
