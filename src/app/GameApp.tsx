'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Grid from '@/components/game/Grid';
import GameWindows from '@/components/game/overlays/GameWindows';
import { useWindowStore } from '@/stores/windowStore';
import LevelUpNotification from '@/components/game/overlays/LevelUpNotification';
import LoadingScreen from '@/components/game/overlays/LoadingScreen';
import GameDebug from '@/components/game/GameDebug';
import { TICK_RATE } from '@/config/gameConfig';
import GameHeader from '@/components/game/GameHeader';
import ChestNotification from '@/components/game/overlays/ChestNotification';
import FloatingText from '@/components/game/FloatingText';
import ClassPickerDialog from '@/components/game/ClassPickerDialog';
import SaveMenuDialog from '@/components/game/overlays/SaveMenuDialog';
import SettingsDialog from '@/components/game/overlays/SettingsDialog';
import RebirthDialog from '@/components/game/overlays/RebirthDialog';
import TutorialDialog from '@/components/game/overlays/TutorialDialog';
import { useSettingsStore } from '@/stores/settingsStore';
import TabLockOverlay from '@/components/game/overlays/TabLockOverlay';
import { useSingleTab } from '@/hooks/useSingleTab';
import { useCtrlSequence } from '@/hooks/useCtrlSequence';
import { useUiStore } from '@/stores/uiStore';
import { useGlobalContextMenu } from '@/hooks/useGlobalContextMenu';
import ContextMenu from '@/components/game/ContextMenu';
import BuildDialog from '@/components/game/BuildDialog';
import ConfirmDialogs from '@/components/game/ConfirmDialogs';
import BottomRightStack from '@/components/game/BottomRightStack';
import CastleCompass from '@/components/game/CastleCompass';
import Toast from '@/components/game/Toast';
import type { Profile } from '@/lib/authClient';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useOfflineClaim } from '@/hooks/useOfflineClaim';
import { useSpawnSync } from '@/hooks/useSpawnSync';
import OfflineDialog from '@/components/game/overlays/OfflineDialog';

interface GameAppProps {
	/** The account's name and hero, given to a brand-new game only (never to one that has been played). */
	profile: Profile;
	/** The signed-in account whose cloud save follows this game (the game is played with an account only). */
	userId: string;
}

export default function GameApp({ profile, userId }: GameAppProps) {
	const tick = useGameStore((state) => state.tick);
	const isHydrated = useGameStore((state) => state.isHydrated);
	const { status: tabStatus, takeOver } = useSingleTab();
	const toggleSaveMenu = useUiStore((state) => state.toggleSaveMenu);
	const loadSettings = useSettingsStore((state) => state.load);
	useEffect(() => loadSettings(), [loadSettings]);
	const loadPrefs = useUiStore((state) => state.loadPrefs);
	useEffect(() => loadPrefs(), [loadPrefs]);
	const loadWindowPositions = useWindowStore((state) => state.loadPositions);
	useEffect(() => loadWindowPositions(), [loadWindowPositions]);
	// no browser menu anywhere: the right click belongs to the game (tiles and bag slots add their own entries)
	useGlobalContextMenu();
	// Hidden shortcut: Control x5 within 2.5 s opens the save tools (export / import / reset)
	useCtrlSequence(5, 2500, toggleSaveMenu);
	// Chest rewards queue in the ui store (one notice per chest, each with its own timer)
	const chestNotices = useUiStore((state) => state.chestNotices);
	const dismissChestNotice = useUiStore((state) => state.dismissChestNotice);
	// Monotonic clock: changing the system clock must not change game speed
	const lastTickTime = useRef(performance.now());

	// What the absence was worth is claimed before the game starts running and before the first upload (the claim changes the game)
	const claim = useOfflineClaim(userId, isHydrated && tabStatus === 'owner');
	useCloudSync(userId, isHydrated && tabStatus === 'owner' && claim === 'done');
	// ... and from then on the server says when a chest or a monster appears (and what is in it), and runs the fights
	useSpawnSync(userId, isHydrated && tabStatus === 'owner' && claim === 'done');
	const applyProfileToFreshGame = useGameStore((state) => state.applyProfileToFreshGame);
	useEffect(() => {
		// Before the first tick: a brand-new game becomes the account's character (a played game is never touched)
		if (!isHydrated || tabStatus !== 'owner') return;
		applyProfileToFreshGame(profile.characterName, profile.playerClass);
	}, [profile, isHydrated, tabStatus, applyProfileToFreshGame]);

	useEffect(() => {
		// Only the owning tab runs the game, and only once the saved game has been loaded
		if (!isHydrated || tabStatus !== 'owner' || claim !== 'done') return;
		lastTickTime.current = performance.now();
		const gameLoop = () => {
			const currentTime = performance.now();
			const deltaTime = currentTime - lastTickTime.current;
			lastTickTime.current = currentTime;

			tick(deltaTime);
		};

		const interval = setInterval(gameLoop, TICK_RATE);
		return () => clearInterval(interval);
	}, [tick, isHydrated, tabStatus, claim]);

	return (
		<main className='h-screen w-screen overflow-hidden relative'>
			{/* z-50 puts the header above the window backdrop (z-45): resources stay visible and the Menu button toggles */}
			<div className='fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm'>
				<GameHeader />
			</div>
			<Grid />
			<FloatingText />
			<GameWindows />
			<ClassPickerDialog />
			<LevelUpNotification />
			<LoadingScreen />
			<GameDebug />
			<SaveMenuDialog />
			<SettingsDialog />
			<RebirthDialog />
			<OfflineDialog />
			<TutorialDialog />
			<BuildDialog />
			<ConfirmDialogs />
			<BottomRightStack />
			<CastleCompass />
			<ContextMenu />
			{tabStatus === 'blocked' && <TabLockOverlay onTakeOver={takeOver} />}
			{/* one stack for every notice: chest rewards, fight loot, and the short messages (merchant, bag, saves) */}
			<div className='notice-stack'>
				{chestNotices.map((notice) => (
					<ChestNotification key={notice.id} loot={notice.loot} onClose={() => dismissChestNotice(notice.id)} />
				))}
				<Toast />
			</div>
		</main>
	);
}
