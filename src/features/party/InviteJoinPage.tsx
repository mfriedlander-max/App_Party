import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { usePartyStore } from '@/store/party-store';
import { useAppStore } from '@/store/app-store';
import { fadeIn } from '@/design-system/animations';

type JoinStatus = 'idle' | 'joining' | 'success' | 'error';

export function InviteJoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const joinParty = usePartyStore((s) => s.joinParty);
  const addToast = useAppStore((s) => s.addToast);
  const [status, setStatus] = useState<JoinStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!code) return;

    async function autoJoin() {
      setStatus('joining');
      try {
        await joinParty(code!);
        setStatus('success');
        addToast({ message: 'Joined the party!', variant: 'success' });
        setTimeout(() => navigate('/party', { replace: true }), 1200);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not join party';
        setStatus('error');
        setErrorMsg(message);
      }
    }

    autoJoin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: '#0A0A0F' }}
    >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-4 text-center"
      >
        <motion.span
          className="text-6xl"
          animate={status === 'joining' ? { rotate: 360 } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          <PartyPopper size={64} className="text-[#FF2D55]" />
        </motion.span>

        {status === 'idle' || status === 'joining' ? (
          <>
            <h1 className="text-text-primary text-2xl font-black">Joining Party…</h1>
            <p className="text-text-secondary text-base">Hang tight while we get you in.</p>
          </>
        ) : status === 'success' ? (
          <>
            <h1 className="text-text-primary text-2xl font-black">You're In!</h1>
            <p className="text-text-secondary text-base">Taking you to the party lobby…</p>
          </>
        ) : (
          <>
            <h1 className="text-text-primary text-2xl font-black">Couldn't Join</h1>
            <p className="text-[#FF2D55] text-base">{errorMsg}</p>
            <Button variant="primary" size="large" onClick={() => navigate('/party', { replace: true })}>
              Go to Party Tab
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
