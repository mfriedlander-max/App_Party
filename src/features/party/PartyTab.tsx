import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Users } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { SheetModal } from '@/design-system/components/SheetModal';
import { PartyLobby } from './PartyLobby';
import { CreateParty } from './CreateParty';
import { usePartyStore } from '@/store/party-store';
import { fadeIn, springs } from '@/design-system/animations';

type JoinState = 'idle' | 'entering';

export function PartyTab() {
  const activeParty = usePartyStore((s) => s.activeParty);
  const joinParty = usePartyStore((s) => s.joinParty);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [joinError, setJoinError] = useState('');

  function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Enter an invite code');
      return;
    }
    setJoinState('entering');
    joinParty(code);
    setJoinOpen(false);
    setJoinCode('');
    setJoinState('idle');
    setJoinError('');
  }

  return (
    <div className="flex flex-col min-h-full">
      <AnimatePresence mode="wait">
        {activeParty ? (
          <motion.div
            key="lobby"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1"
          >
            <PartyLobby party={activeParty} />
          </motion.div>
        ) : (
          <motion.div
            key="no-party"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-4 px-4 pt-8 pb-6 flex-1"
          >
            <div className="mb-4">
              <h1 className="text-text-primary text-2xl font-black mb-1">Party Mode</h1>
              <p className="text-text-secondary text-base">
                Create or join a party to track drinks with friends.
              </p>
            </div>

            {/* Create card */}
            <motion.button
              onClick={() => setCreateOpen(true)}
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              className="flex flex-col gap-3 p-6 rounded-2xl cursor-pointer text-left"
              style={{
                background: 'rgba(255,45,85,0.08)',
                border: '1.5px solid rgba(255,45,85,0.3)',
                boxShadow: '0 0 24px rgba(255,45,85,0.08)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,45,85,0.15)' }}
              >
                <PartyPopper size={28} className="text-[#FF2D55]" />
              </div>
              <div>
                <h2 className="text-text-primary text-xl font-bold mb-1">Create Party</h2>
                <p className="text-text-secondary text-base">
                  Start a new party and invite your friends.
                </p>
              </div>
            </motion.button>

            {/* Join card */}
            <motion.button
              onClick={() => setJoinOpen(true)}
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              className="flex flex-col gap-3 p-6 rounded-2xl cursor-pointer text-left"
              style={{
                background: 'rgba(0,229,255,0.06)',
                border: '1.5px solid rgba(0,229,255,0.2)',
                boxShadow: '0 0 24px rgba(0,229,255,0.06)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,229,255,0.12)' }}
              >
                <Users size={28} className="text-[#00E5FF]" />
              </div>
              <div>
                <h2 className="text-text-primary text-xl font-bold mb-1">Join Party</h2>
                <p className="text-text-secondary text-base">
                  Enter an invite code to join a friend's party.
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create party sheet */}
      <CreateParty isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Join party sheet */}
      <SheetModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} title="Join Party">
        <div className="flex flex-col gap-4 pb-6">
          <p className="text-text-secondary text-base">Enter the invite code your friend shared with you.</p>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase());
              if (e.target.value) setJoinError('');
            }}
            placeholder="e.g. RTF42X"
            maxLength={8}
            className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text-primary text-xl font-mono tracking-widest placeholder:text-text-muted outline-none focus:border-glow transition-colors text-center uppercase"
          />
          {joinError && (
            <p className="text-[#FF2D55] text-base text-center">{joinError}</p>
          )}
          <Button
            variant="primary"
            size="large"
            onClick={handleJoin}
            disabled={joinState === 'entering'}
            fullWidth
          >
            Join Party
          </Button>
        </div>
      </SheetModal>
    </div>
  );
}
