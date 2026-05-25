import { useState, useRef, useCallback } from 'react'

export type ScreenCaptureStatus = 'idle' | 'capturing' | 'processing' | 'error'
export type TranscriptionProvider = 'openai' | 'huggingface'

export interface CaptureOpts {
  provider: TranscriptionProvider
  apiKey: string
  translateToEnglish: boolean
}

export interface UseScreenCaptureReturn {
  status: ScreenCaptureStatus
  isCapturing: boolean
  isProcessing: boolean
  error: string | null
  startCapture: (opts: CaptureOpts) => Promise<void>
  stopCapture: () => void
}

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions'
const HF_MODEL = 'openai/whisper-large-v3-turbo'

async function transcribeOpenAI(blob: Blob, mimeType: string, opts: CaptureOpts): Promise<string> {
  const form = new FormData()
  form.append('file', blob, `audio.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`)
  form.append('model', 'whisper-1')
  form.append('response_format', 'text')
  if (opts.translateToEnglish) form.append('task', 'translate')

  const res = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    body: form,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`OpenAI Whisper error (${res.status}): ${msg}`)
  }
  return res.text()
}

async function transcribeHuggingFace(blob: Blob, opts: CaptureOpts): Promise<string> {
  const endpoint = `https://api-inference.huggingface.co/models/${HF_MODEL}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': blob.type || 'audio/webm',
    },
    body: blob,
  })

  if (res.status === 503) {
    // Model is cold-starting on HF free tier
    const json = await res.json().catch(() => ({})) as { estimated_time?: number }
    const wait = Math.ceil(json.estimated_time ?? 20)
    throw new Error(`Hugging Face model is warming up (est. ${wait}s). Please wait a moment and try again.`)
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Hugging Face error (${res.status}): ${msg}`)
  }

  const json = await res.json() as { text?: string }
  return json.text ?? ''
}

export function useScreenCapture(onTranscript: (text: string) => void): UseScreenCaptureReturn {
  const [status, setStatus] = useState<ScreenCaptureStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const optsRef = useRef<CaptureOpts>({ provider: 'openai', apiKey: '', translateToEnglish: true })

  const stopCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const startCapture = useCallback(async (opts: CaptureOpts) => {
    optsRef.current = opts
    setError(null)
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // Cast needed for non-standard Chrome options
        ...(({ audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 } }) as unknown as object),
        audio: true,
      })
    } catch (err) {
      const name = (err as Error).name
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setError('Screen sharing was cancelled.')
      } else {
        setError(`Could not start screen capture: ${(err as Error).message}`)
      }
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      stream.getTracks().forEach(t => t.stop())
      setError(
        'No audio captured. You must: (1) choose "Chrome Tab" in the share dialog — not Window or Screen, (2) check the "Share tab audio" checkbox before clicking Share.'
      )
      return
    }

    stream.getVideoTracks().forEach(t => t.stop())

    const audioStream = new MediaStream(audioTracks)
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'

    const recorder = new MediaRecorder(audioStream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      audioStream.getTracks().forEach(t => t.stop())

      if (chunksRef.current.length === 0) {
        setStatus('idle')
        return
      }

      setStatus('processing')
      try {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        const { provider } = optsRef.current
        const text = provider === 'openai'
          ? await transcribeOpenAI(blob, mimeType, optsRef.current)
          : await transcribeHuggingFace(blob, optsRef.current)

        if (text.trim()) onTranscript(text.trim())
        setStatus('idle')
        setError(null)
      } catch (err) {
        setError((err as Error).message ?? String(err))
        setStatus('error')
      }
    }

    audioTracks[0].onended = () => {
      if (recorder.state !== 'inactive') recorder.stop()
    }

    recorder.start()
    setStatus('capturing')
  }, [onTranscript])

  return {
    status,
    isCapturing: status === 'capturing',
    isProcessing: status === 'processing',
    error,
    startCapture,
    stopCapture,
  }
}
