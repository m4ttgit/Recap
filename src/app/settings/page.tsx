'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Settings as SettingsIcon, Save, RefreshCw, Key, Server, Zap, Mic, LayoutDashboard, User, LogOut, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'

interface SettingsData {
  asrProvider: string
  asrModel?: string | null
  customAsrModel?: string | null
  llmProvider: string
  llmModel: string
  customLlmModel?: string | null
  llmApiKey?: string | null
  llmBaseURL?: string | null
  diarizationEnabled: boolean
  diarizationProvider: string
}

const ASR_PROVIDERS = [
  { value: 'zai-sdk', label: 'Z.ai SDK (Default)', description: 'Built-in speech recognition' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Access multiple ASR models' },
  { value: 'local', label: 'Local Model', description: 'Self-hosted Whisper or similar' }
]

const ASR_MODELS: Record<string, { value: string; label: string }[]> = {
  zai_sdk: [
    { value: 'default', label: 'Default Model' }
  ],
  openrouter: [
    { value: 'whisper-large-v3', label: 'Whisper Large V3' },
    { value: 'canary-1b', label: 'NVIDIA Canary 1B' },
    { value: 'custom', label: 'Custom Model' }
  ],
  local: [
    { value: 'whisper-base', label: 'Whisper Base' },
    { value: 'whisper-small', label: 'Whisper Small' },
    { value: 'whisper-medium', label: 'Whisper Medium' },
    { value: 'whisper-large-v3', label: 'Whisper Large V3' },
    { value: 'custom', label: 'Custom Model' }
  ]
}

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'GPT models' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude models' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Access multiple LLMs' },
  { value: 'local', label: 'Local Model', description: 'Self-hosted LLaMA, Mistral, etc.' }
]

const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
  ],
  openrouter: [
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (via OpenRouter)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OpenRouter)' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' }
  ],
  local: [
    { value: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
    { value: 'mistral-7b', label: 'Mistral 7B' },
    { value: 'custom', label: 'Custom Model' }
  ]
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Failed to load settings</p>
            <Button onClick={fetchSettings} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableModels = LLM_MODELS[settings.llmProvider] || []
  const availableAsrModels = ASR_MODELS[settings.asrProvider.replace('-', '_')] || []

  return (
    <AuthGuard>
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
              {status === 'loading' ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
              ) : session ? (
                <>
                  <Link href="/stats">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <Mic className="w-4 h-4 mr-2" />
                      Transcribe
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Configure AI providers and model preferences
              </p>
            </div>
          </div>
        </div>

        {/* ASR Settings */}
        <Card className="mb-6 shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-500" />
              Speech Recognition (ASR)
            </CardTitle>
            <CardDescription>
              Choose the AI provider for speech-to-text transcription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="asrProvider">ASR Provider</Label>
              <Select
                value={settings.asrProvider}
                onValueChange={(value) => {
                  setSettings({
                    ...settings,
                    asrProvider: value,
                    asrModel: ASR_MODELS[value.replace('-', '_')]?.[0]?.value || 'default'
                  })
                }}
              >
                <SelectTrigger id="asrProvider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASR_PROVIDERS.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-xs text-slate-500">{provider.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {settings.asrProvider !== 'zai-sdk' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="asrModel">ASR Model</Label>
                  <Select
                    value={settings.asrModel || ''}
                    onValueChange={(value) => setSettings({ ...settings, asrModel: value })}
                  >
                    <SelectTrigger id="asrModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAsrModels.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom ASR Model Name Input */}
                {settings.asrModel === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customAsrModel" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Custom Model Name
                    </Label>
                    <Input
                      id="customAsrModel"
                      placeholder="e.g., whisper-large-v3-turbo, canary-1b, distil-whisper-large-v3"
                      value={settings.customAsrModel || ''}
                      onChange={(e) => setSettings({ ...settings, customAsrModel: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">
                      Enter the exact model name from your ASR provider. For Ollama, run <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ollama list</code> to see available models.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* LLM Settings */}
        <Card className="mb-6 shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-violet-500" />
              Language Model (LLM)
            </CardTitle>
            <CardDescription>
              Choose the AI provider for meeting report generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="llmProvider">LLM Provider</Label>
              <Select
                value={settings.llmProvider}
                onValueChange={(value) => {
                  setSettings({
                    ...settings,
                    llmProvider: value,
                    llmModel: LLM_MODELS[value]?.[0]?.value || 'gpt-4o-mini'
                  })
                }}
              >
                <SelectTrigger id="llmProvider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-xs text-slate-500">{provider.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="llmModel">LLM Model</Label>
              <Select
                value={settings.llmModel}
                onValueChange={(value) => setSettings({ ...settings, llmModel: value })}
              >
                <SelectTrigger id="llmModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Model Name Input for Local Provider */}
            {settings.llmProvider === 'local' && settings.llmModel === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customLlmModel" className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Custom Model Name
                </Label>
                <Input
                  id="customLlmModel"
                  placeholder="e.g., ollama/llama3.2:latest, mistral-7b-instruct"
                  value={settings.customLlmModel || ''}
                  onChange={(e) => setSettings({ ...settings, customLlmModel: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Enter the exact model name from Ollama (e.g., <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ollama list</code>). Example: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ollama/llama3.2:latest</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">llama3.2:latest</code>
                </p>
              </div>
            )}

            {settings.llmProvider !== 'openai' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="llmApiKey" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="llmApiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your API key"
                      value={settings.llmApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, llmApiKey: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Your API key is stored securely and only used for API requests
                  </p>
                </div>

                {settings.llmProvider === 'openrouter' && (
                  <div className="space-y-2">
                    <Label htmlFor="llmBaseURL">Base URL (Optional)</Label>
                    <Input
                      id="llmBaseURL"
                      placeholder="https://openrouter.ai/api/v1"
                      value={settings.llmBaseURL || ''}
                      onChange={(e) => setSettings({ ...settings, llmBaseURL: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">
                      Custom base URL for OpenRouter or compatible API
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Diarization Settings */}
        <Card className="mb-6 shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-violet-500" />
              Speaker Diarization
            </CardTitle>
            <CardDescription>
              Configure speaker detection and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="diarizationEnabled">Enable Speaker Diarization</Label>
                <p className="text-sm text-slate-500">
                  Automatically identify and separate different speakers
                </p>
              </div>
              <Switch
                id="diarizationEnabled"
                checked={settings.diarizationEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, diarizationEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diarizationProvider">Diarization Provider</Label>
              <Select
                value={settings.diarizationProvider}
                onValueChange={(value) => setSettings({ ...settings, diarizationProvider: value })}
                disabled={!settings.diarizationEnabled}
              >
                <SelectTrigger id="diarizationProvider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pyannote">Pyannote (Default)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Currently, only Pyannote is supported. More options coming soon.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
