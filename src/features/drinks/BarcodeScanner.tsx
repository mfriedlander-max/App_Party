import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'barcode-scanner-viewfinder';

interface BarcodeScannerProps {
  readonly onBarcodeDetected: (barcode: string) => void;
  readonly onClose: () => void;
  readonly onCameraUnavailable?: () => void;
}

export function BarcodeScanner({
  onBarcodeDetected,
  onClose,
  onCameraUnavailable,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore stop errors — scanner may already be stopped
      }
      scannerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (!mounted || detectedRef.current) return;
            detectedRef.current = true;
            stopScanner().then(() => {
              if (mounted) {
                onBarcodeDetected(decodedText);
              }
            });
          },
          () => {
            // Ignore per-frame scan errors — normal when no barcode in frame
          },
        );
      } catch {
        if (mounted) {
          onCameraUnavailable?.();
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [onBarcodeDetected, onCameraUnavailable, stopScanner]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pb-3 pt-4">
        <p className="text-white text-base font-semibold">Scan Barcode</p>
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          aria-label="Close scanner"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* html5-qrcode mounts the video into this element */}
        <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

        {/* Scanning overlay frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Dark mask with transparent centre */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Viewfinder cutout */}
          <div className="relative z-10 w-[280px] h-[170px]">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00E5FF] rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00E5FF] rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00E5FF] rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00E5FF] rounded-br-sm" />

            {/* Scanning line animation */}
            <motion.div
              className="absolute left-2 right-2 h-0.5 bg-[#00E5FF] shadow-[0_0_8px_2px_rgba(0,229,255,0.6)]"
              animate={{ top: ['8px', '154px', '8px'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-6 py-4 pb-safe-bottom pb-6">
        <p className="text-white/60 text-sm text-center">
          Point your camera at the barcode on the packaging
        </p>
      </div>
    </div>
  );
}
