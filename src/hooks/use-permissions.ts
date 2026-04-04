import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PermissionStatus = 'not-asked' | 'granted' | 'denied';

interface LastLocation {
  readonly lat: number;
  readonly lng: number;
}

export interface PermissionsState {
  readonly camera: PermissionStatus;
  readonly photos: PermissionStatus;
  readonly location: PermissionStatus;
  readonly lastLocation: LastLocation | null;
  readonly requestCamera: () => Promise<void>;
  readonly requestPhotos: () => Promise<void>;
  readonly requestLocation: () => Promise<void>;
  readonly revokeCamera: () => void;
  readonly revokePhotos: () => void;
  readonly revokeLocation: () => void;
}

export const usePermissions = create<PermissionsState>()(
  persist(
    (set) => ({
      camera: 'not-asked' as PermissionStatus,
      photos: 'not-asked' as PermissionStatus,
      location: 'not-asked' as PermissionStatus,
      lastLocation: null,

      requestCamera: async () => {
        set({ camera: 'not-asked' });
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          set({ camera: 'granted' });
        } catch {
          // Browser blocked — still show as requestable, not permanently denied
          set({ camera: 'not-asked' });
        }
      },

      requestPhotos: async () => {
        set({ photos: 'not-asked' });
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        set({ photos: 'granted' });
      },

      requestLocation: async () => {
        set({ location: 'not-asked' });
        try {
          await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                set({
                  location: 'granted',
                  lastLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                });
                resolve();
              },
              () => {
                reject();
              },
            );
          });
        } catch {
          // Browser blocked — still show as requestable
          set({ location: 'not-asked' });
        }
      },

      revokeCamera: () => set({ camera: 'not-asked' }),
      revokePhotos: () => set({ photos: 'not-asked' }),
      revokeLocation: () => set({ location: 'not-asked', lastLocation: null }),
    }),
    {
      name: 'app-party-permissions',
      partialize: (state) => ({
        camera: state.camera,
        photos: state.photos,
        location: state.location,
        lastLocation: state.lastLocation,
      }),
    },
  ),
);
