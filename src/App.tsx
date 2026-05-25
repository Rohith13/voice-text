import { motion } from 'framer-motion'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import MicButton from './components/MicButton'
import WaveformBars from './components/WaveformBars'
import TranscriptDisplay from './components/TranscriptDisplay'
import StatusBar from './components/StatusBar'
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
  const {
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
    setLanguage,
  } = useSpeechRecognition()

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

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

          <motion.section
            className="hero-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          >
            <div
              className="mic-glow"
              style={{
                opacity: isListening ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
              aria-hidden="true"
            />

            <MicButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={handleToggle}
            />

            <WaveformBars isListening={isListening} barCount={32} />
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
              interimTranscript={interimTranscript}
              isListening={isListening}
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
              isListening={isListening}
              error={error}
              language={language}
              onLanguageChange={setLanguage}
            />
          </motion.section>

          <motion.footer
            className="app-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p>
              Uses the{' '}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Speech API
              </a>
              {' '}— best supported in Chrome and Edge. All processing happens locally in your browser.
            </p>
          </motion.footer>

        </div>
      </main>
    </div>
  )
}
