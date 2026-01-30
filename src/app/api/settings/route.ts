import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings - Retrieve current settings
export async function GET() {
  try {
    let settings = await db.settings.findFirst()
    
    // Create default settings if none exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          asrProvider: 'zai-sdk',
          llmProvider: 'openai',
          llmModel: 'gpt-4o-mini',
          diarizationEnabled: true,
          diarizationProvider: 'pyannote'
        }
      })
    }

    // Don't expose API key in response
    const { llmApiKey, ...safeSettings } = settings

    return NextResponse.json({
      success: true,
      settings: safeSettings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (body.asrProvider && !['zai-sdk', 'openrouter', 'local'].includes(body.asrProvider)) {
      return NextResponse.json(
        { error: 'Invalid ASR provider' },
        { status: 400 }
      )
    }

    if (body.llmProvider && !['openai', 'openrouter', 'local', 'anthropic'].includes(body.llmProvider)) {
      return NextResponse.json(
        { error: 'Invalid LLM provider' },
        { status: 400 }
      )
    }

    // Get or create settings
    let settings = await db.settings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          ...(body.asrProvider !== undefined && { asrProvider: body.asrProvider }),
          ...(body.asrModel !== undefined && { asrModel: body.asrModel }),
          ...(body.llmProvider !== undefined && { llmProvider: body.llmProvider }),
          ...(body.llmModel !== undefined && { llmModel: body.llmModel }),
          ...(body.llmApiKey !== undefined && { llmApiKey: body.llmApiKey }),
          ...(body.llmBaseURL !== undefined && { llmBaseURL: body.llmBaseURL }),
          ...(body.diarizationEnabled !== undefined && { diarizationEnabled: body.diarizationEnabled }),
          ...(body.diarizationProvider !== undefined && { diarizationProvider: body.diarizationProvider }),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new settings
      settings = await db.settings.create({
        data: {
          asrProvider: body.asrProvider || 'zai-sdk',
          asrModel: body.asrModel,
          llmProvider: body.llmProvider || 'openai',
          llmModel: body.llmModel || 'gpt-4o-mini',
          llmApiKey: body.llmApiKey || '',
          llmBaseURL: body.llmBaseURL || '',
          diarizationEnabled: body.diarizationEnabled !== undefined ? body.diarizationEnabled : true,
          diarizationProvider: body.diarizationProvider || 'pyannote'
        }
      })
    }

    // Don't expose API key in response
    const { llmApiKey, ...safeSettings } = settings

    return NextResponse.json({
      success: true,
      settings: safeSettings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
