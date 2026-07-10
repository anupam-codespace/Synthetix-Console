import { create } from 'zustand';

interface UiStore {
  isCommandPaletteOpen: boolean;
  isShortcutModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  activeJobDetailsId: string | null;
  activeNotificationReplayJobId: string | null;
  theme: 'dark' | 'light';

  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutModalOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveJobDetailsId: (id: string | null) => void;
  setActiveNotificationReplayJobId: (id: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isCommandPaletteOpen: false,
  isShortcutModalOpen: false,
  isMobileSidebarOpen: false,
  activeJobDetailsId: null,
  activeNotificationReplayJobId: null,
  theme: 'dark',

  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setShortcutModalOpen: (isShortcutModalOpen) => set({ isShortcutModalOpen }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  setActiveJobDetailsId: (activeJobDetailsId) => set({ activeJobDetailsId }),
  setActiveNotificationReplayJobId: (activeNotificationReplayJobId) => set({ activeNotificationReplayJobId }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
