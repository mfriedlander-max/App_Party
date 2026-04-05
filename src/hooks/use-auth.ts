import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

export interface Profile {
  id: string
  name: string
  avatar_url: string
  weight_kg: number
  height_cm: number
  biological_sex: 'male' | 'female'
  xp: number
  level: number
  streak_weekends: number
  last_active_weekend: string
  home_lat: number | null
  home_lng: number | null
  created_at: string
  updated_at: string
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>
  _setSession: (session: Session | null) => void
  _setLoading: (loading: boolean) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      loading: true,

      signInWithGoogle: async () => {
        const client = getSupabaseClient()
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        })
        if (error) {
          throw new Error(`Google sign-in failed: ${error.message}`)
        }
      },

      signOut: async () => {
        const client = getSupabaseClient()
        const { error } = await client.auth.signOut()
        if (error) {
          throw new Error(`Sign-out failed: ${error.message}`)
        }
        set({ session: null, user: null, profile: null })
      },

      fetchProfile: async () => {
        const { user } = get()
        if (!user) return

        const client = getSupabaseClient()
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          throw new Error(`Failed to fetch profile: ${error.message}`)
        }

        set({ profile: data as Profile })
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) throw new Error('Not authenticated')

        const client = getSupabaseClient()
        const { data, error } = await client
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to update profile: ${error.message}`)
        }

        set({ profile: data as Profile })
      },

      _setSession: (session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      },

      _setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'app-party-auth',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        profile: state.profile,
      }),
    }
  )
)

// Initialize auth listener — call once at app startup
let initialized = false

export function initAuthListener(): void {
  if (initialized) return
  initialized = true

  const client = getSupabaseClient()
  const { _setSession, _setLoading, fetchProfile } = useAuth.getState()

  // Get initial session
  client.auth.getSession().then(({ data: { session } }) => {
    _setSession(session)
    _setLoading(false)
    if (session) {
      fetchProfile().catch(() => {
        // Profile may not exist yet; ignore
      })
    }
  }).catch(() => {
    _setLoading(false)
  })

  client.auth.onAuthStateChange((_event, session) => {
    _setSession(session)
    _setLoading(false)
    if (session) {
      useAuth.getState().fetchProfile().catch(() => {
        // Profile may not exist yet; ignore
      })
    }
  })
}
