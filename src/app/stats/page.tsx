'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Mic, FileAudio, Clock, FileText, BarChart3, Server, RefreshCw, Settings as SettingsIcon, User, LogOut, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/auth-guard'

interface DashboardStats {
  totalTranscriptions: number
  totalReports: number
  totalWords: number
  totalAudioSize: number
  transcriptionsByProvider: Array<{ provider: string; count: number }>
  reportsByProvider: Array<{ provider: string; count: number }>
}

interface RecentItem {
  id: string
  fileName?: string
  summary?: string
  wordCount?: number
  asrProvider?: string
  llmProvider?: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTranscriptions, setRecentTranscriptions] = useState<RecentItem[]>([])
  const [recentReports, setRecentReports] = useState<RecentItem[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecentTranscriptions(data.recent?.transcriptions || [])
        setRecentReports(data.recent?.reports || [])
        setSettings(data.settings)
      } else {
        setError(data.error || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      setError('Failed to connect to server')
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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
              {status === 'loading' ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
              ) : session ? (
                <>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Statistics
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <User className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Statistics
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                View your transcription and report statistics
              </p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                <FileAudio className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTranscriptions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReports}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Transcribed</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audio Processed</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(stats.totalAudioSize)}</div>
                <p className="text-xs text-muted-foreground">Total size</p>
              </CardContent>
            </Card>
          </div>
        )}

        {settings && (
          <Card className="mb-8 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Current Configuration</CardTitle>
              <CardDescription>Active AI providers and models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ASR Provider</p>
                  <Badge variant="secondary">{settings.asrProvider || 'Not configured'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">LLM Provider</p>
                  <Badge variant="secondary">{settings.llmProvider || 'Not configured'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">LLM Model</p>
                  <Badge variant="secondary">{settings.llmModel || 'Not configured'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Diarization</p>
                  <Badge variant={settings.diarizationEnabled ? 'default' : 'secondary'}>
                    {settings.diarizationEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats && stats.transcriptionsByProvider && stats.transcriptionsByProvider.length > 0 && (
          <Card className="mb-8 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Transcriptions by Provider</CardTitle>
              <CardDescription>Number of transcriptions per ASR provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.transcriptionsByProvider.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.provider}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats && stats.reportsByProvider && stats.reportsByProvider.length > 0 && (
          <Card className="mb-8 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Reports by Provider</CardTitle>
              <CardDescription>Number of reports generated per LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.reportsByProvider.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.provider}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Transcriptions</CardTitle>
              <CardDescription>Latest audio transcriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTranscriptions && recentTranscriptions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentTranscriptions.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                          {item.fileName || 'Unknown file'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.asrProvider || 'Unknown'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No transcriptions yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Reports</CardTitle>
              <CardDescription>Latest meeting reports generated</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReports && recentReports.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentReports.map((item) => (
                    <div key={item.id} className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {item.summary || 'No summary available'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.llmProvider || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No reports generated yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Mic className="w-4 h-4 mr-2" />
                  New Transcription
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  <Server className="w-4 h-4 mr-2" />
                  Configure AI Providers
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  fetchDashboardData()
                  toast.success('Statistics refreshed')
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  )
}
