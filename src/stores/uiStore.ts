import { create } from 'zustand';

// Transient UI flags (never persisted): dialogs that are opened from several places.
interface UiState {
	classDialogOpen: boolean;
	openClassDialog: () => void;
	closeClassDialog: () => void;
	saveMenuOpen: boolean;
	toggleSaveMenu: () => void;
	closeSaveMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
	classDialogOpen: false,
	openClassDialog: () => set({ classDialogOpen: true }),
	closeClassDialog: () => set({ classDialogOpen: false }),
	saveMenuOpen: false,
	toggleSaveMenu: () => set((state) => ({ saveMenuOpen: !state.saveMenuOpen })),
	closeSaveMenu: () => set({ saveMenuOpen: false }),
}));
