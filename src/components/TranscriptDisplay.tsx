import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MAX_TRANSCRIPT_CHARS } from '../hooks/useSpeechRecognition'

interface TranscriptDisplayProps {
  transcript: string
  interimTranscript: string
  isListening: boolean
  onClear: () => void
  onTranscriptChange: (text: string) => void
}

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: '#334155',
      userSelect: 'none',
      padding: '32px 20px',
    }}
  >
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="#334155" strokeWidth="1.5" />
      <line x1="8" y1="8" x2="16" y2="8" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="12" y2="16" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#475569', textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
      Your transcription will appear here.
      <br />
      Press the microphone to begin speaking.
    </p>
  </motion.div>
)

export default function TranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
  onClear,
  onTranscriptChange,
}: TranscriptDisplayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isEmpty = transcript.trim() === '' && interimTranscript.trim() === ''
  const words = wordCount(transcript)
  const chars = transcript.length
  const atLimit = chars >= MAX_TRANSCRIPT_CHARS

  // The full text shown in the textarea — interim appended at the end while listening
  const displayValue = isListening && interimTranscript
    ? transcript + interimTranscript
    : transcript

  // Auto-scroll textarea to bottom as content grows
  useEffect(() => {
    const el = textareaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [transcript, interimTranscript])

  const handleCopy = useCallback(() => {
    const fullText = (transcript + ' ' + interimTranscript).trim()
    if (fullText) navigator.clipboard.writeText(fullText).catch(() => {})
  }, [transcript, interimTranscript])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTranscriptChange(e.target.value)
  }, [onTranscriptChange])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748b',
            }}
          >
            Transcript
          </span>

          <AnimatePresence>
            {isListening && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#818cf8',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#6366f1',
                    display: 'inline-block',
                  }}
                />
                Live
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isEmpty && (
            <span
              style={{
                fontSize: '0.75rem',
                color: atLimit ? '#ef4444' : '#475569',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.2s',
              }}
            >
              {words} {words === 1 ? 'word' : 'words'} · {chars.toLocaleString()}/{MAX_TRANSCRIPT_CHARS.toLocaleString()}
            </span>
          )}

          {!isEmpty && (
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              style={actionButtonStyle}
              onMouseEnter={e => applyHover(e, 'rgba(99,102,241,0.12)', '#a5b4fc', 'rgba(99,102,241,0.3)')}
              onMouseLeave={e => applyHover(e, 'rgba(255,255,255,0.04)', '#94a3b8', 'rgba(255,255,255,0.08)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </button>
          )}

          {!isEmpty && (
            <button
              onClick={onClear}
              title="Clear transcript"
              style={actionButtonStyle}
              onMouseEnter={e => applyHover(e, 'rgba(239,68,68,0.1)', '#fca5a5', 'rgba(239,68,68,0.25)')}
              onMouseLeave={e => applyHover(e, 'rgba(255,255,255,0.04)', '#94a3b8', 'rgba(255,255,255,0.08)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', minHeight: 280 }}>
        {isEmpty && !isListening ? (
          <EmptyState />
        ) : (
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={handleChange}
            maxLength={MAX_TRANSCRIPT_CHARS}
            placeholder="Start speaking or type here…"
            spellCheck
            style={{
              width: '100%',
              minHeight: 280,
              maxHeight: 420,
              resize: 'vertical',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '20px 24px',
              color: '#e2e8f0',
              fontSize: '1.05rem',
              fontFamily: 'inherit',
              lineHeight: 1.8,
              fontWeight: 400,
              overflowY: 'auto',
              display: 'block',
            }}
          />
        )}

        {/* Char limit warning strip */}
        <AnimatePresence>
          {atLimit && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                padding: '6px 20px',
                background: 'rgba(239,68,68,0.08)',
                borderTop: '1px solid rgba(239,68,68,0.2)',
                fontSize: '0.75rem',
                color: '#fca5a5',
                textAlign: 'center',
              }}
            >
              Character limit reached ({MAX_TRANSCRIPT_CHARS.toLocaleString()}). Clear some text to continue.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const actionButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '5px 10px',
  cursor: 'pointer',
  color: '#94a3b8',
  fontSize: '0.75rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  transition: 'all 0.15s',
}

function applyHover(e: React.MouseEvent<HTMLButtonElement>, bg: string, color: string, border: string) {
  const t = e.currentTarget
  t.style.background = bg
  t.style.color = color
  t.style.borderColor = border
}
