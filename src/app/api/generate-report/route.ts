import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { transcription, timestamp, diarization } = await request.json()

    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json(
        { error: 'Transcription text is required' },
        { status: 400 }
      )
    }

    if (transcription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcription is too short to generate a meaningful report. Please provide more content.' },
        { status: 400 }
      )
    }

    // Get settings
    const settings = await db.settings.findFirst()
    const llmProvider = settings?.llmProvider || 'openai'
    const llmModel = settings?.llmModel || 'gpt-4o-mini'

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Build enhanced transcription with speaker information if available
    let enhancedTranscription = transcription

    if (diarization && diarization.enabled && diarization.segments && diarization.segments.length > 0) {
      // Format transcription with speaker labels for better analysis
      enhancedTranscription = diarization.segments
        .map(seg => `[${seg.speaker}]: ${seg.text}`)
        .join('\n\n')
    }

    // Create a prompt for generating a structured meeting report
    const prompt = `You are an expert meeting analyst. Analyze the following meeting transcription and generate a comprehensive meeting report.

${diarization?.enabled ? 'NOTE: The transcription includes speaker labels (e.g., [SPEAKER_00], [SPEAKER_01]). Use these to track who said what and identify participants.\n' : ''}
MEETING TRANSCRIPTION:
${enhancedTranscription}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the meeting's main purpose and outcome",
  "keyPoints": [
    "Key point 1 from the meeting",
    "Key point 2 from the meeting",
    "Key point 3 from the meeting",
    ...
  ],
  "actionItems": [
    {
      "task": "Specific action item",
      "assignee": "Person responsible (optional, mention 'Not specified' if unclear)",
      "deadline": "Deadline date or timeframe (optional, mention 'Not specified' if unclear)"
    }
  ],
  "participants": [
    "Participant 1 name or role",
    "Participant 2 name or role",
    ...
  ],
  "date": "Meeting date or 'Not specified'"
}

Guidelines:
1. Extract 5-7 key points that capture the main discussions
2. Identify action items with specific tasks, assignees (if mentioned by name or role), and deadlines when mentioned
3. List participants mentioned by name or identified through speaker labels
${diarization?.enabled ? '4. When speaker labels are present, track which speakers contributed to different topics\n5. Try to identify patterns in speaker contributions (e.g., who raised issues, who proposed solutions)\n6.' : '4.'} The summary should be professional and actionable
${diarization?.enabled ? '7.' : '5.'} Only include information explicitly mentioned in the transcription
${diarization?.enabled ? '8.' : '6.'} If information is not available, use "Not specified"

Return ONLY valid JSON, no additional text.`

    // Generate report using LLM
    const response = await zai.chat.completions.create({
      model: llmModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes meeting transcripts and generates structured meeting reports in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })

    if (!response.choices || !response.choices[0] || !response.choices[0].message?.content) {
      return NextResponse.json(
        { error: 'Failed to generate report from AI response' },
        { status: 500 }
      )
    }

    // Parse the AI response
    let report
    try {
      // Extract JSON from the response (in case there's any surrounding text)
      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? jsonMatch[0] : content
      report = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        {
          error: 'Failed to parse AI-generated report',
          rawResponse: response.choices[0].message.content
        },
        { status: 500 }
      )
    }

    // Validate the report structure
    if (!report.summary || !Array.isArray(report.keyPoints) || !Array.isArray(report.actionItems)) {
      return NextResponse.json(
        { error: 'Invalid report structure generated' },
        { status: 500 }
      )
    }

    // Save report to database
    await db.meetingReport.create({
      data: {
        summary: report.summary,
        keyPoints: JSON.stringify(report.keyPoints || []),
        actionItems: JSON.stringify(report.actionItems || []),
        participants: JSON.stringify(report.participants || []),
        date: report.date || timestamp ? new Date(timestamp).toLocaleDateString() : 'Not specified',
        llmProvider: llmProvider,
        llmModel: llmModel
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        summary: report.summary,
        keyPoints: report.keyPoints || [],
        actionItems: report.actionItems || [],
        participants: report.participants || [],
        date: report.date || timestamp ? new Date(timestamp).toLocaleDateString() : 'Not specified'
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Report generation error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Report generation failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
