import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get transcription statistics
    const totalTranscriptions = await db.transcription.count()
    const recentTranscriptions = await db.transcription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get report statistics
    const totalReports = await db.meetingReport.count()
    const recentReports = await db.meetingReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get current settings
    const settings = await db.settings.findFirst()

    // Calculate statistics by provider
    const transcriptionsByProvider = await db.transcription.groupBy({
      by: ['asrProvider'],
      _count: true
    })

    const reportsByProvider = await db.meetingReport.groupBy({
      by: ['llmProvider'],
      _count: true
    })

    // Calculate total words transcribed
    const totalWords = await db.transcription.aggregate({
      _sum: {
        wordCount: true
      }
    })

    // Calculate total audio processed
    const totalAudioSize = await db.transcription.aggregate({
      _sum: {
        fileSize: true
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalTranscriptions: totalTranscriptions || 0,
        totalReports: totalReports || 0,
        totalWords: totalWords._sum.wordCount || 0,
        totalAudioSize: totalAudioSize._sum.fileSize || 0,
        transcriptionsByProvider: transcriptionsByProvider.map(p => ({
          provider: p.asrProvider,
          count: p._count
        })),
        reportsByProvider: reportsByProvider.map(p => ({
          provider: p.llmProvider,
          count: p._count
        }))
      },
      recent: {
        transcriptions: recentTranscriptions.map(t => ({
          id: t.id,
          fileName: t.fileName,
          wordCount: t.wordCount,
          createdAt: t.createdAt,
          asrProvider: t.asrProvider
        })),
        reports: recentReports.map(r => ({
          id: r.id,
          summary: r.summary.substring(0, 100) + '...',
          llmProvider: r.llmProvider,
          createdAt: r.createdAt
        }))
      },
      settings: settings ? {
        asrProvider: settings.asrProvider,
        llmProvider: settings.llmProvider,
        llmModel: settings.llmModel,
        diarizationEnabled: settings.diarizationEnabled
      } : null
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
