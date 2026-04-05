import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth, initAuthListener } from '@/hooks/use-auth'
import { SignInPage } from './SignInPage'

interface AuthGateProps {
  readonly children: ReactNode
}

function LoadingSpinner() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#0A0A0F' }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className="text-5xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          🎉
        </motion.span>
        <p className="text-base" style={{ color: '#9090A0' }}>Loading…</p>
      </motion.div>
    </div>
  )
}

// If Supabase env vars are missing, skip auth entirely (dev fallback)
const hasSupabaseConfig =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export function AuthGate({ children }: AuthGateProps) {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (hasSupabaseConfig) {
      initAuthListener()
    }
  }, [])

  // Dev fallback: no Supabase config → skip auth
  if (!hasSupabaseConfig) {
    return <>{children}</>
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <SignInPage />
  }

  return <>{children}</>
}
