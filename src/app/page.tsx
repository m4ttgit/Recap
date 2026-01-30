'use client'

import { useState } from 'react'
import { Upload, FileAudio, Mic, FileText, Download, RefreshCw, Sparkles, Calendar, Users, CheckCircle, User, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

interface SpeakerSegment {
  text: string
  speaker: string
  start: number
  end: number
}

interface TranscriptionResult {
  id: string
  text: string
  wordCount: number
  timestamp: string
  duration?: number
  diarization?: {
    enabled: boolean
    speakerCount: number
    totalDuration: number
    segments: SpeakerSegment[] | null
  }
}

interface MeetingReport {
  summary: string
  keyPoints: string[]
  actionItems: Array<{
    task: string
    assignee?: string
    deadline?: string
  }>
  participants: string[]
  date: string
}

export default function MeetingTranscriber() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [progress, setProgress] = useState(0)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [report, setReport] = useState<MeetingReport | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [enableDiarization, setEnableDiarization] = useState(true)

  const handleFileSelect = (file: File) => {
    // Accept all common audio formats - will be converted to WAV if needed
    const validTypes = [
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/webm',
      'audio/mpeg', 'audio/mp3',
      'audio/mp4', 'audio/x-m4a',
      'audio/ogg',
      'audio/flac'
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['wav', 'webm', 'mp3', 'm4a', 'ogg', 'flac']

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      toast.error('Invalid file type', {
        description: 'Please upload an audio file (WAV, WebM, MP3, M4A, OGG, or FLAC).'
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload a file smaller than 100MB.'
      })
      return
    }

    setSelectedFile(file)
    setTranscription(null)
    setReport(null)
    toast.success('File selected', {
      description: `${file.name} is ready to transcribe.`
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleTranscribe = async () => {
    if (!selectedFile) return

    setIsTranscribing(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('audio', selectedFile)
      formData.append('enableDiarization', enableDiarization.toString())

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transcription failed')
      }

      const data = await response.json()

      setTranscription({
        id: Date.now().toString(),
        text: data.transcription,
        wordCount: data.wordCount || data.transcription.split(/\s+/).length,
        timestamp: new Date().toISOString(),
        duration: data.duration,
        diarization: data.diarization
      })

      let description = `Successfully transcribed ${data.wordCount || data.transcription.split(/\s+/).length} words.`

      if (data.formatConverted) {
        description += ` Converted from ${data.originalFormat?.toUpperCase()} to WAV.`
      }

      if (data.diarization?.enabled) {
        description += ` ${data.diarization.speakerCount} speakers detected.`
      }

      toast.success('Transcription complete!', {
        description
      })
    } catch (error) {
      console.error('Transcription error:', error)
      toast.error('Transcription failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!transcription) return

    setIsGeneratingReport(true)

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcription: transcription.text,
          timestamp: transcription.timestamp,
          diarization: transcription.diarization
        })
      })

      if (!response.ok) {
        throw new Error('Report generation failed')
      }

      const data = await response.json()
      setReport(data.report)

      toast.success('Report generated successfully!')
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error('Report generation failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDownloadReport = () => {
    if (!report || !transcription) return

    const reportContent = `MEETING REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
${report.summary}

KEY POINTS
${report.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

ACTION ITEMS
${report.actionItems.map((item, i) => 
  `${i + 1}. ${item.task}${item.assignee ? ` (Assignee: ${item.assignee})` : ''}${item.deadline ? ` (Due: ${item.deadline})` : ''}`
).join('\n')}

PARTICIPANTS
${report.participants.length > 0 ? report.participants.join(', ') : 'Not detected'}

FULL TRANSCRIPTION
${transcription.text}
`

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Report downloaded!')
  }

  const handleReset = () => {
    setSelectedFile(null)
    setTranscription(null)
    setReport(null)
    setProgress(0)
    toast.success('Reset successfully')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-50">Meeting Transcriber</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Mic className="w-4 h-4 mr-2" />
                  Transcribe
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Meeting Transcriber
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Convert audio recordings into text and generate meeting reports
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload and Transcription */}
          <div className="space-y-6">
            {/* Upload Card */}
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Audio
                </CardTitle>
                <CardDescription>
                  Drag and drop or click to select an audio file (WAV, WebM, MP3, M4A, OGG, FLAC). Maximum 100MB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
                    dragActive
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-violet-400'
                  }`}
                >
                  <input
                    type="file"
                    id="audio-input"
                    className="hidden"
                    accept=".wav,.webm,.mp3,.m4a,.ogg,.flac,audio/*"
                    onChange={handleInputChange}
                  />
                  <label
                    htmlFor="audio-input"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      dragActive
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      WAV, WebM, MP3, M4A, OGG, FLAC • Max 100MB
                    </p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileAudio className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {selectedFile.name}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Badge>
                    </div>

                    {/* Diarization Toggle */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-violet-500" />
                        <div className="flex flex-col">
                          <Label htmlFor="diarization-toggle" className="text-sm font-medium">
                            Speaker Diarization
                          </Label>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Identify different speakers in the audio
                          </span>
                        </div>
                      </div>
                      <Switch
                        id="diarization-toggle"
                        checked={enableDiarization}
                        onCheckedChange={setEnableDiarization}
                      />
                    </div>

                    <Button
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                      className="w-full"
                    >
                      {isTranscribing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Transcribe Audio
                        </>
                      )}
                    </Button>

                    {isTranscribing && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600 dark:text-slate-400">
                            {enableDiarization ? 'Processing audio & detecting speakers...' : 'Processing audio...'}
                          </span>
                          <span className="font-medium text-violet-600 dark:text-violet-400">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcription Result */}
            {transcription && (
              <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Transcription Result
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  <CardDescription>
                    {transcription.wordCount} words • {new Date(transcription.timestamp).toLocaleString()}
                    {transcription.diarization?.enabled && transcription.diarization.speakerCount > 0 && (
                      <span className="ml-2">• {transcription.diarization.speakerCount} speakers detected</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Speaker-labeled transcription view */}
                  {transcription.diarization?.enabled && transcription.diarization.segments && transcription.diarization.segments.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {transcription.diarization.segments.map((segment, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {segment.speaker}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {segment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Plain text view */
                    <Textarea
                      value={transcription.text}
                      onChange={(e) => setTranscription({ ...transcription, text: e.target.value })}
                      className="min-h-[300px] max-h-[400px] resize-y"
                      placeholder="Transcription will appear here..."
                    />
                  )}

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport || !transcription.text.trim()}
                    className="w-full mt-4"
                  >
                    {isGeneratingReport ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Meeting Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Report Display */}
          {report && (
            <Card className="shadow-lg border-slate-200 dark:border-slate-800 h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Meeting Report
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <CardDescription>
                  AI-generated summary and action items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="points">Points</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="prose dark:prose-invert text-sm">
                      {report.summary || (
                        <Alert>
                          <AlertDescription>No summary available</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="points" className="space-y-3 mt-4">
                    {report.keyPoints.length > 0 ? (
                      report.keyPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{point}</p>
                        </div>
                      ))
                    ) : (
                      <Alert>
                        <AlertDescription>No key points available</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-3 mt-4">
                    {report.actionItems.length > 0 ? (
                      report.actionItems.map((item, index) => (
                        <Card key={index} className="border-slate-200 dark:border-slate-800">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                                  {item.task}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.assignee && (
                                    <Badge variant="outline" className="text-xs">
                                      <Users className="w-3 h-3 mr-1" />
                                      {item.assignee}
                                    </Badge>
                                  )}
                                  {item.deadline && (
                                    <Badge variant="outline" className="text-xs">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {item.deadline}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Alert>
                        <AlertDescription>No action items available</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                          Date
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {report.date || new Date(transcription.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                          Participants
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {report.participants.length > 0 ? (
                            report.participants.map((participant, index) => (
                              <Badge key={index} variant="secondary">
                                {participant}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Not detected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Empty State for Report */}
          {!report && transcription && !isGeneratingReport && (
            <Card className="shadow-lg border-slate-200 dark:border-slate-800 h-fit">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  No Report Generated Yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 text-center max-w-xs">
                  Generate a meeting report from your transcription to see summary, key points, and action items.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Powered by AI • Convert meeting audio into actionable insights</p>
        </footer>
      </div>
    </div>
  )
}
