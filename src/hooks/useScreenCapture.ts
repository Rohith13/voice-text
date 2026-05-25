import { useState, useRef, useCallback } from 'react'

const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions'

export type ScreenCaptureStatus = 'idle' | 'capturing' | 'processing' | 'error'

export interface UseScreenCaptureReturn {
  status: ScreenCaptureStatus
  isCapturing: boolean
  isProcessing: boolean
  error: string | null
  startCapture: (opts: { apiKey: string; translateToEnglish: boolean }) => Promise<void>
  stopCapture: () => void
}

export function useScreenCapture(onTranscript: (text: string) => void): UseScreenCaptureReturn {
  const [status, setStatus] = useState<ScreenCaptureStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const optsRef = useRef({ apiKey: '', translateToEnglish: true })

  const sendToWhisper = useCallback(async (blob: Blob): Promise<string> => {
    const { apiKey, translateToEnglish } = optsRef.current
    const form = new FormData()
    form.append('file', blob, 'audio.webm')
    form.append('model', 'whisper-1')
    if (translateToEnglish) {
      form.append('task', 'translate')
    }
    form.append('response_format', 'text')

    const res = await fetch(WHISPER_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw new Error(`Whisper API error (${res.status}): ${msg}`)
    }

    return res.text()
  }, [])

  const stopCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const startCapture = useCallback(async (opts: { apiKey: string; translateToEnglish: boolean }) => {
    optsRef.current = opts
    setError(null)
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
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
      setError('No audio found. In the share dialog, make sure to enable "Share tab audio" or "Share system audio".')
      return
    }

    // Drop video — we only need audio
    stream.getVideoTracks().forEach(t => t.stop())

    const audioStream = new MediaStream(audioTracks)
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

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
        const text = await sendToWhisper(blob)
        if (text.trim()) {
          onTranscript(text.trim())
        }
        setStatus('idle')
        setError(null)
      } catch (err) {
        setError((err as Error).message ?? String(err))
        setStatus('error')
      }
    }

    // User stops share from browser chrome (the X button in the sharing bar)
    audioTracks[0].onended = () => {
      if (recorder.state !== 'inactive') recorder.stop()
    }

    recorder.start()
    setStatus('capturing')
  }, [sendToWhisper, onTranscript])

  return {
    status,
    isCapturing: status === 'capturing',
    isProcessing: status === 'processing',
    error,
    startCapture,
    stopCapture,
  }
}
