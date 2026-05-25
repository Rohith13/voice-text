import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'voicescribe_openai_key'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (key: string) => void
}

export function getSavedApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [value, setValue] = useState(() => getSavedApiKey())

  useEffect(() => {
    if (isOpen) setValue(getSavedApiKey())
  }, [isOpen])

  const handleSave = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    onSave(trimmed)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111827',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 20,
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 460,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              OpenAI API Key
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Used to transcribe screen audio via Whisper. Stored only in your browser — never sent anywhere except OpenAI.
            </p>

            <input
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="sk-..."
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                outline: 'none',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 9,
                  padding: '8px 18px',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!value.trim()}
                style={{
                  background: value.trim()
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(99,102,241,0.2)',
                  border: 'none',
                  borderRadius: 9,
                  padding: '8px 18px',
                  color: value.trim() ? '#fff' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: value.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                Save & Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
