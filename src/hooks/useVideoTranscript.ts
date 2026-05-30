import { useState, useCallback } from 'react'

export type VideoTranscriptStatus = 'idle' | 'loading' | 'done' | 'error'

export interface UseVideoTranscriptReturn {
  status: VideoTranscriptStatus
  isLoading: boolean
  error: string | null
  fetchTranscript: (url: string) => Promise<void>
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    // youtube.com/watch?v=ID  or  /shorts/ID  or  /embed/ID  or  /live/ID
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const idx = parts.findIndex(p => ['shorts', 'embed', 'live', 'v'].includes(p))
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
    }
  } catch {
    // fall through
  }
  return null
}

export function useVideoTranscript(onTranscript: (text: string) => void): UseVideoTranscriptReturn {
  const [status, setStatus] = useState<VideoTranscriptStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const fetchTranscript = useCallback(async (url: string) => {
    setError(null)
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      setError('Could not parse a YouTube video ID from that URL. Paste a YouTube, YouTube Shorts, or youtu.be link.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`/.netlify/functions/youtube-transcript?videoId=${encodeURIComponent(videoId)}`)
      const json = await res.json() as { transcript?: string; error?: string }
      if (!res.ok || json.error) {
        throw new Error(json.error ?? `Server error (${res.status})`)
      }
      if (!json.transcript?.trim()) {
        throw new Error('No captions found for this video. The video may not have subtitles enabled, or they may be auto-generated and disabled by the channel.')
      }
      onTranscript(json.transcript.trim())
      setStatus('done')
      setError(null)
    } catch (err) {
      setError((err as Error).message ?? String(err))
      setStatus('error')
    }
  }, [onTranscript])

  return {
    status,
    isLoading: status === 'loading',
    error,
    fetchTranscript,
  }
}
