import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/design-system/components/Button'

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function SignInPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0A0A0F' }}
    >
      {/* Background gradient blobs */}
      <div
        className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Decorative party emojis */}
      <motion.span
        className="absolute top-[12%] left-[8%] text-4xl select-none pointer-events-none"
        animate={{ rotate: [0, 10, -10, 0], y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        🎉
      </motion.span>
      <motion.span
        className="absolute top-[18%] right-[10%] text-3xl select-none pointer-events-none"
        animate={{ rotate: [0, -8, 8, 0], y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        aria-hidden="true"
      >
        🍹
      </motion.span>
      <motion.span
        className="absolute bottom-[22%] left-[12%] text-3xl select-none pointer-events-none"
        animate={{ rotate: [0, 12, -12, 0], y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        aria-hidden="true"
      >
        🎊
      </motion.span>
      <motion.span
        className="absolute bottom-[28%] right-[8%] text-4xl select-none pointer-events-none"
        animate={{ rotate: [0, -10, 10, 0], y: [0, 8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        aria-hidden="true"
      >
        🥂
      </motion.span>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / App name */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-6xl" aria-hidden="true">🎉</span>
          <h1
            className="text-5xl font-extrabold tracking-tight"
            style={{ color: '#F0F0F5' }}
          >
            App Party
          </h1>
          <p
            className="text-center text-lg leading-relaxed"
            style={{ color: '#9090A0' }}
          >
            Track your drinks. Compete with friends.{'\n'}Remember the night.
          </p>
        </div>

        {/* Sign-in card */}
        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: '#13131A',
            border: '1px solid #2A2A38',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={handleSignIn}
            disabled={loading}
          >
            <span className="flex items-center gap-3">
              <GoogleIcon />
              <span>{loading ? 'Signing in…' : 'Sign in with Google'}</span>
            </span>
          </Button>

          {error && (
            <p className="text-sm text-center" style={{ color: '#FF453A' }}>
              {error}
            </p>
          )}
        </div>

        <p className="text-xs text-center" style={{ color: '#5A5A70' }}>
          By signing in you agree to our terms of service and privacy policy.
        </p>
      </motion.div>
    </div>
  )
}
