import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useScreenCapture } from './hooks/useScreenCapture'
import MicButton from './components/MicButton'
import WaveformBars from './components/WaveformBars'
import TranscriptDisplay from './components/TranscriptDisplay'
import StatusBar from './components/StatusBar'
import ModeSelector, { type CaptureMode } from './components/ModeSelector'
import ApiKeyModal, { getSavedApiKey, getSavedProvider } from './components/ApiKeyModal'
import type { TranscriptionProvider } from './hooks/useScreenCapture'
import { useVideoTranscript } from './hooks/useVideoTranscript'
import './App.css'

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
    <rect x="10" y="5" width="8" height="11" rx="4" fill="white" />
    <path d="M6 13a8 8 0 0 0 16 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="14" y1="21" x2="14" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="24" x2="18" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export default function App() {
  const [mode, setMode] = useState<CaptureMode>('microphone')
  const [translateToEnglish, setTranslateToEnglish] = useState(true)
  const [showApiModal, setShowApiModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
    updateTranscript,
    error: micError,
    isSupported,
    language,
    setLanguage,
  } = useSpeechRecognition()

  // Append results to the shared transcript (used by both screen and video modes)
  const handleScreenTranscript = useCallback((text: string) => {
    updateTranscript((prev: string) => {
      const separator = prev.trim() ? '\n\n' : ''
      return prev + separator + text
    })
  }, [updateTranscript])

  const {
    isLoading: isVideoLoading,
    error: videoError,
    fetchTranscript: fetchVideoTranscript,
  } = useVideoTranscript(handleScreenTranscript)

  const {
    status: screenStatus,
    isCapturing,
    isProcessing,
    error: screenError,
    startCapture,
    stopCapture,
  } = useScreenCapture(handleScreenTranscript)

  const handleMicToggle = () => {
    if (isListening) stopListening()
    else startListening()
  }

  const handleScreenToggle = () => {
    if (isCapturing) {
      stopCapture()
      return
    }
    const provider = getSavedProvider()
    const apiKey = getSavedApiKey(provider)
    if (!apiKey) {
      setShowApiModal(true)
      return
    }
    startCapture({ provider, apiKey, translateToEnglish })
  }

  const handleApiKeySaved = (provider: TranscriptionProvider, key: string) => {
    startCapture({ provider, apiKey: key, translateToEnglish })
  }

  const activeError = mode === 'microphone' ? micError : mode === 'screen' ? screenError : videoError
  const isActive = mode === 'microphone' ? isListening : isCapturing

  return (
    <div className="app-root">
      <div className="bg-grid" aria-hidden="true" />

      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="header-inner">
          <div className="header-brand">
            <LogoIcon />
            <div className="header-titles">
              <h1 className="header-title">VoiceScribe</h1>
              <span className="header-subtitle">Real-time transcription</span>
            </div>
          </div>

          <div className="header-badge">
            <span className="badge-dot" />
            <span className="badge-text">Browser Only · No Data Sent</span>
          </div>
        </div>
      </motion.header>

      <main className="app-main">
        <div className="app-container">

          {/* Mode selector */}
          <motion.div
            style={{ display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <ModeSelector mode={mode} onChange={(m) => {
              if (isListening) stopListening()
              if (isCapturing) stopCapture()
              setVideoUrl('')
              setMode(m)
            }} />
          </motion.div>

          {/* Hero */}
          <motion.section
            className="hero-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          >
            <div
              className="mic-glow"
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.6s ease' }}
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              {mode === 'microphone' ? (
                <motion.div
                  key="mic"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                  <MicButton
                    isListening={isListening}
                    isSupported={isSupported}
                    onToggle={handleMicToggle}
                  />
                </motion.div>
              ) : mode === 'video' ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 480 }}
                >
                  <VideoUrlPanel
                    url={videoUrl}
                    onUrlChange={setVideoUrl}
                    isLoading={isVideoLoading}
                    onFetch={() => fetchVideoTranscript(videoUrl)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="screen"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
                >
                  <ScreenCaptureButton
                    status={screenStatus}
                    isCapturing={isCapturing}
                    isProcessing={isProcessing}
                    onToggle={handleScreenToggle}
                  />

                  {/* Translate toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                    <div
                      onClick={() => setTranslateToEnglish(v => !v)}
                      style={{
                        width: 38,
                        height: 22,
                        borderRadius: 11,
                        background: translateToEnglish ? '#6366f1' : 'rgba(255,255,255,0.1)',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 3,
                        left: translateToEnglish ? 19 : 3,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Translate to English (Whisper)
                    </span>
                  </label>

                  {/* API key settings link */}
                  <button
                    onClick={() => setShowApiModal(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#475569',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    {getSavedApiKey(getSavedProvider()) ? 'Change API key / provider' : 'Set API key (free option available)'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== 'video' && <WaveformBars isListening={isActive} barCount={32} />}
          </motion.section>

          <motion.div
            className="section-divider"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            aria-hidden="true"
          />

          <motion.section
            className="transcript-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
          >
            <TranscriptDisplay
              transcript={transcript}
              interimTranscript={mode === 'microphone' ? interimTranscript : ''}
              isListening={isActive}
              onClear={clearTranscript}
              onTranscriptChange={updateTranscript}
            />
          </motion.section>

          <motion.section
            className="status-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          >
            <StatusBar
              isListening={isActive}
              isProcessing={isProcessing}
              error={activeError}
              language={language}
              onLanguageChange={setLanguage}
              mode={mode}
            />
          </motion.section>

          <motion.footer
            className="app-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p>
              Mic mode uses the{' '}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API" target="_blank" rel="noopener noreferrer">
                Web Speech API
              </a>
              {' '}· Screen mode uses{' '}
              <a href="https://openai.com/research/whisper" target="_blank" rel="noopener noreferrer">
                OpenAI Whisper
              </a>
              {' '}· Video URL mode fetches YouTube captions · Instagram Reels: use Screen Audio mode
            </p>
          </motion.footer>

        </div>
      </main>

      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSave={(provider, key) => handleApiKeySaved(provider, key)}
      />
    </div>
  )
}

// ── Video URL panel ───────────────────────────────────────────────────────────

interface VideoUrlPanelProps {
  url: string
  onUrlChange: (url: string) => void
  isLoading: boolean
  onFetch: () => void
}

function VideoUrlPanel({ url, onUrlChange, isLoading, onFetch }: VideoUrlPanelProps) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Icon */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: isLoading
          ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isLoading ? '0 8px 32px rgba(245,158,11,0.35)' : '0 8px 32px rgba(239,68,68,0.3)',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}>
        {isLoading ? (
          <motion.svg
            width="36" height="36" viewBox="0 0 24 24" fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeDasharray="28 8" strokeLinecap="round" />
          </motion.svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" fill="white" />
          </svg>
        )}
      </div>

      <p style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: isLoading ? '#fbbf24' : '#94a3b8' }}>
        {isLoading ? 'Fetching captions…' : 'YouTube / Shorts'}
      </p>

      {/* URL input + button */}
      <div style={{ width: '100%', display: 'flex', gap: 8 }}>
        <input
          type="url"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isLoading && url.trim() && onFetch()}
          placeholder="https://youtube.com/watch?v=..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#e2e8f0',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={onFetch}
          disabled={isLoading || !url.trim()}
          style={{
            background: isLoading || !url.trim()
              ? 'rgba(239,68,68,0.15)'
              : 'linear-gradient(135deg, #dc2626, #ef4444)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            color: isLoading || !url.trim() ? '#6b7280' : '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          Get Transcript
        </button>
      </div>

      {/* Info note */}
      <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', lineHeight: 1.6, maxWidth: 380 }}>
        Works with YouTube videos, Shorts, and youtu.be links that have captions enabled.
        <br />
        For Instagram Reels, use <strong style={{ color: '#94a3b8' }}>Screen Audio</strong> mode instead.
      </p>
    </div>
  )
}

// ── Screen capture button ──────────────────────────────────────────────────────

interface ScreenCaptureButtonProps {
  status: string
  isCapturing: boolean
  isProcessing: boolean
  onToggle: () => void
}

function ScreenCaptureButton({ status, isCapturing, isProcessing, onToggle }: ScreenCaptureButtonProps) {
  const label = isProcessing ? 'Transcribing…' : isCapturing ? 'Stop Capture' : 'Start Screen Capture'
  const isDisabled = isProcessing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence>
          {isCapturing && Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1.8 + i * 0.35, opacity: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `2px solid rgba(34, 197, 94, ${0.5 - i * 0.15})`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>

        <motion.button
          onClick={isDisabled ? undefined : onToggle}
          disabled={isDisabled}
          aria-label={label}
          whileHover={!isDisabled ? { scale: 1.06 } : {}}
          whileTap={!isDisabled ? { scale: 0.94 } : {}}
          animate={isCapturing ? {
            scale: [1, 1.04, 1],
            boxShadow: ['0 8px 32px rgba(34,197,94,0.35)', '0 12px 48px rgba(34,197,94,0.55)', '0 8px 32px rgba(34,197,94,0.35)'],
          } : {
            scale: 1,
            boxShadow: isProcessing ? '0 8px 32px rgba(245,158,11,0.35)' : '0 8px 32px rgba(34,197,94,0.2)',
          }}
          transition={isCapturing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          style={{
            position: 'relative',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: 'none',
            cursor: isDisabled ? 'wait' : 'pointer',
            background: isProcessing
              ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
              : isCapturing
                ? 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            zIndex: 1,
            opacity: isDisabled ? 0.7 : 1,
          }}
        >
          <span style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

          {isProcessing ? (
            <motion.svg
              width="36" height="36" viewBox="0 0 24 24" fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeDasharray="28 8" strokeLinecap="round" />
            </motion.svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {isCapturing ? (
                <rect x="6" y="6" width="12" height="12" rx="2" fill="white" stroke="none" />
              ) : (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </>
              )}
            </svg>
          )}

          <AnimatePresence>
            {isCapturing && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{ position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <motion.p
        key={status}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
          color: isProcessing ? '#fbbf24' : isCapturing ? '#4ade80' : '#94a3b8',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </motion.p>
    </div>
  )
}
