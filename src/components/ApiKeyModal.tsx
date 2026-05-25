import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TranscriptionProvider } from '../hooks/useScreenCapture'

const STORAGE_KEY_OPENAI = 'voicescribe_openai_key'
const STORAGE_KEY_HF     = 'voicescribe_hf_key'
const STORAGE_KEY_PROV   = 'voicescribe_provider'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (provider: TranscriptionProvider, key: string) => void
}

export function getSavedProvider(): TranscriptionProvider {
  return (localStorage.getItem(STORAGE_KEY_PROV) as TranscriptionProvider) || 'huggingface'
}

export function getSavedApiKey(provider: TranscriptionProvider): string {
  return localStorage.getItem(provider === 'openai' ? STORAGE_KEY_OPENAI : STORAGE_KEY_HF) ?? ''
}

const PROVIDER_INFO: Record<TranscriptionProvider, {
  label: string
  placeholder: string
  helpUrl: string
  helpText: string
  isFree: boolean
  description: string
}> = {
  huggingface: {
    label: 'Hugging Face',
    placeholder: 'hf_...',
    helpUrl: 'https://huggingface.co/settings/tokens',
    helpText: 'Get a free token',
    isFree: true,
    description: 'Free tier — uses Whisper Large v3 Turbo. Sign up at huggingface.co and create a free Read token.',
  },
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Get an API key',
    isFree: false,
    description: 'Paid (~$0.006/min) — uses whisper-1. Faster and more reliable than the free option.',
  },
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [provider, setProvider] = useState<TranscriptionProvider>(() => getSavedProvider())
  const [value, setValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedProvider()
      setProvider(saved)
      setValue(getSavedApiKey(saved))
    }
  }, [isOpen])

  // When provider tab changes, load that provider's saved key
  const handleProviderChange = (p: TranscriptionProvider) => {
    setProvider(p)
    setValue(getSavedApiKey(p))
  }

  const handleSave = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    localStorage.setItem(provider === 'openai' ? STORAGE_KEY_OPENAI : STORAGE_KEY_HF, trimmed)
    localStorage.setItem(STORAGE_KEY_PROV, provider)
    onSave(provider, trimmed)
    onClose()
  }

  const info = PROVIDER_INFO[provider]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 20,
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
              width: '100%', maxWidth: 480,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
              Transcription Provider
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 20 }}>
              Your key is stored only in this browser — never sent to us.
            </p>

            {/* Provider tabs */}
            <div style={{
              display: 'flex', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 12, padding: 4, marginBottom: 20,
            }}>
              {(['huggingface', 'openai'] as TranscriptionProvider[]).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  style={{
                    flex: 1, position: 'relative',
                    background: provider === p ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.25))' : 'transparent',
                    border: provider === p ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                    borderRadius: 9, padding: '8px 12px',
                    color: provider === p ? '#e2e8f0' : '#475569',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {PROVIDER_INFO[p].label}
                  {PROVIDER_INFO[p].isFree && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                      borderRadius: 999, background: 'rgba(34,197,94,0.15)',
                      border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80',
                    }}>
                      FREE
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Description */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6,
            }}>
              {info.description}
              {' '}
              <a href={info.helpUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
                {info.helpText} →
              </a>
            </div>

            {/* Instructions box */}
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              fontSize: '0.78rem', color: '#64748b', lineHeight: 1.7,
            }}>
              <strong style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                How to share tab audio (important):
              </strong>
              1. Click "Start Screen Capture"<br />
              2. In the share dialog, choose the <strong style={{ color: '#a5b4fc' }}>Chrome Tab</strong> tab (not Window or Screen)<br />
              3. Select the tab playing your video<br />
              4. Check <strong style={{ color: '#a5b4fc' }}>"Share tab audio"</strong> at the bottom<br />
              5. Click Share — then Stop when done
            </div>

            <input
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={info.placeholder}
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10, padding: '10px 14px',
                color: '#e2e8f0', fontSize: '0.9rem',
                fontFamily: 'monospace', outline: 'none', marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 9, padding: '8px 18px',
                  color: '#64748b', fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!value.trim()}
                style={{
                  background: value.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.2)',
                  border: 'none', borderRadius: 9, padding: '8px 20px',
                  color: value.trim() ? '#fff' : '#475569',
                  fontSize: '0.85rem', fontWeight: 600,
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
