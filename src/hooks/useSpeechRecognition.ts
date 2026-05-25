import { useState, useRef, useCallback, useEffect } from 'react'

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export const MAX_TRANSCRIPT_CHARS = 10000

export interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  clearTranscript: () => void
  updateTranscript: (text: string) => void
  error: string | null
  isSupported: boolean
  language: string
  setLanguage: (lang: string) => void
}

export const LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (BR)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ru-RU', label: 'Russian' },
]

const getSpeechRecognitionConstructor = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState('en-US')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
  const finalTranscriptRef = useRef('')

  const isSupported = getSpeechRecognitionConstructor() !== null

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  const createRecognition = useCallback((lang: string): SpeechRecognition | null => {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor) return null

    const rec = new Constructor()
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.lang = lang

    rec.onstart = () => {
      setError(null)
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          finalChunk += text
        } else {
          interim += text
        }
      }

      if (finalChunk) {
        const updated = (finalTranscriptRef.current + finalChunk + ' ').slice(0, MAX_TRANSCRIPT_CHARS)
        finalTranscriptRef.current = updated
        setTranscript(updated)
      }

      setInterimTranscript(interim)
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error
      if (code === 'no-speech' || code === 'aborted') return

      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone permissions and refresh.',
        'audio-capture': 'No microphone found. Please connect a microphone and try again.',
        network: 'Network error during transcription. Check your connection.',
        'service-not-allowed': 'Speech recognition service blocked. Try using Chrome or Edge.',
      }

      setError(messages[code] ?? `Speech recognition error: ${code}`)
      setIsListening(false)
      isListeningRef.current = false
      shouldRestartRef.current = false
    }

    rec.onend = () => {
      setInterimTranscript('')
      if (shouldRestartRef.current && isListeningRef.current) {
        try {
          rec.start()
        } catch {
          // Recognition already started or disposed — ignore
        }
      }
    }

    return rec
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Web Speech API is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    setError(null)
    shouldRestartRef.current = true

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = createRecognition(language)
    if (!rec) return
    recognitionRef.current = rec

    try {
      rec.start()
      setIsListening(true)
      isListeningRef.current = true
    } catch (err) {
      setError(`Could not start recognition: ${String(err)}`)
    }
  }, [isSupported, language, createRecognition])

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    setIsListening(false)
    setInterimTranscript('')

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [])

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const updateTranscript = useCallback((text: string) => {
    const trimmed = text.slice(0, MAX_TRANSCRIPT_CHARS)
    finalTranscriptRef.current = trimmed
    setTranscript(trimmed)
  }, [])

  const handleSetLanguage = useCallback((lang: string) => {
    setLanguage(lang)
    if (!isListeningRef.current) return

    // Abort current session and immediately restart with the new language
    shouldRestartRef.current = false
    isListeningRef.current = false
    setIsListening(false)
    setInterimTranscript('')

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = createRecognition(lang)
    if (!rec) return
    recognitionRef.current = rec
    shouldRestartRef.current = true
    isListeningRef.current = true
    setIsListening(true)
    setError(null)

    try {
      rec.start()
    } catch (err) {
      setError(`Could not start recognition: ${String(err)}`)
      setIsListening(false)
      isListeningRef.current = false
      shouldRestartRef.current = false
    }
  }, [createRecognition])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
    updateTranscript,
    error,
    isSupported,
    language,
    setLanguage: handleSetLanguage,
  }
}
