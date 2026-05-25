import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGE_OPTIONS } from '../hooks/useSpeechRecognition'
import type { CaptureMode } from './ModeSelector'

type Status = 'idle' | 'listening' | 'processing' | 'error'

interface StatusBarProps {
  isListening: boolean
  isProcessing: boolean
  error: string | null
  language: string
  onLanguageChange: (lang: string) => void
  mode: CaptureMode
}

function getStatus(isListening: boolean, isProcessing: boolean, error: string | null): Status {
  if (error) return 'error'
  if (isProcessing) return 'processing'
  if (isListening) return 'listening'
  return 'idle'
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; dotColor: string }> = {
  idle:       { label: 'Idle',        color: '#64748b', dotColor: '#475569' },
  listening:  { label: 'Listening',   color: '#22c55e', dotColor: '#22c55e' },
  processing: { label: 'Transcribing',color: '#f59e0b', dotColor: '#f59e0b' },
  error:      { label: 'Error',       color: '#ef4444', dotColor: '#ef4444' },
}

export default function StatusBar({ isListening, isProcessing, error, language, onLanguageChange, mode }: StatusBarProps) {
  const status = getStatus(isListening, isProcessing, error)
  const { label, color, dotColor } = STATUS_CONFIG[status]
  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 20px',
        background: 'rgba(17,24,39,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.1)',
        borderRadius: 14,
        fontSize: '0.8rem',
      }}
    >
      {/* Left: status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
          <AnimatePresence>
            {(status === 'listening' || status === 'processing') && (
              <motion.span
                key="ping"
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor }}
              />
            )}
          </AnimatePresence>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor, transition: 'background 0.3s' }} />
        </span>

        <span style={{ color, fontWeight: 600, transition: 'color 0.3s', letterSpacing: '0.02em' }}>
          {label}
        </span>

        <AnimatePresence>
          {error && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              style={{ color: '#fca5a5', fontWeight: 400, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              — {error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Right: language selector (mic only) + branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {mode === 'microphone' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ color: '#475569', fontSize: '0.75rem' }}>Language:</span>
              <select
                value={language}
                onChange={e => onLanguageChange(e.target.value)}
                title={`Recognized as: ${currentLang?.label ?? language}`}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 7,
                  padding: '3px 28px 3px 8px',
                  color: '#94a3b8',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 7px center',
                  minWidth: 140,
                  transition: 'border-color 0.2s',
                }}
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code} style={{ background: '#111827', color: '#e2e8f0' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)' }} />
          </>
        )}

        <span style={{ color: '#334155', fontSize: '0.72rem', letterSpacing: '0.01em' }}>
          {mode === 'microphone' ? 'Web Speech API · Browser only' : 'Whisper API · Audio sent to OpenAI'}
        </span>
      </div>
    </div>
  )
}
