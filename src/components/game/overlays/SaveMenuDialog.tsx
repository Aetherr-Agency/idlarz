import React, { useRef, useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { pickPersisted, type PersistedGame } from '@/lib/sanitizeSave';
import { commitImport, exportSave, parseSave, resetSave } from '@/lib/saveVault';
import { formatTime } from '@/utils/formatters';
import { countOwnedTiles } from '@/utils/gameUtils';
import PixelModal from '../PixelModal';

type Message = { kind: 'ok' | 'error'; text: string };

const MAX_FILE_BYTES = 5_000_000;

const stamp = () => {
	const d = new Date();
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

/**
 * Hidden save tools (press Control five times quickly). Export downloads the encrypted save, Import validates
 * a save file before replacing the current progress, Reset wipes the stored save.
 */
const SaveMenuDialog: React.FC = () => {
	const open = useUiStore((state) => state.saveMenuOpen);
	const close = useUiStore((state) => state.closeSaveMenu);
	const [message, setMessage] = useState<Message | null>(null);
	const [pendingImport, setPendingImport] = useState<PersistedGame | null>(null);
	const [confirmReset, setConfirmReset] = useState(false);
	const [busy, setBusy] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	if (!open) return null;

	const handleClose = () => {
		setMessage(null);
		setPendingImport(null);
		setConfirmReset(false);
		close();
	};

	const handleExport = async () => {
		setBusy(true);
		try {
			const text = await exportSave(pickPersisted(useGameStore.getState()));
			const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = `idlarz-${stamp()}.sav`;
			link.click();
			URL.revokeObjectURL(url);
			setMessage({ kind: 'ok', text: 'Save exported.' });
		} catch {
			setMessage({ kind: 'error', text: 'Export failed.' });
		} finally {
			setBusy(false);
		}
	};

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		setPendingImport(null);
		if (file.size > MAX_FILE_BYTES) {
			setMessage({ kind: 'error', text: 'That file is too large to be a save.' });
			return;
		}
		setBusy(true);
		const result = await parseSave(await file.text());
		setBusy(false);
		if (result.ok) {
			setMessage(null);
			setPendingImport(result.state);
		} else {
			setMessage({ kind: 'error', text: result.reason });
		}
	};

	const confirmImport = async () => {
		if (!pendingImport) return;
		setBusy(true);
		await commitImport(pendingImport);
		window.location.reload();
	};

	const confirmResetGame = async () => {
		setBusy(true);
		await resetSave();
		window.location.reload();
	};

	return (
		<PixelModal title='Save Tools' size='sm' onClose={handleClose}>
			<p className='text-sm text-[#a89878] mb-4'>
				Your progress is stored encrypted in this browser. Export it to back it up or move it to another
				browser.
			</p>

			{message && (
				<div
					className={`px-card mb-3 text-sm ${message.kind === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
					{message.text}
				</div>
			)}

			{pendingImport ? (
				<div className='px-card mb-3 text-sm'>
					<div className='px-h'>Replace current progress?</div>
					<div className='text-[#d8c8a0] mb-3'>
						Save file: level {pendingImport.level.level}, castle {pendingImport.tiles[25][25].level ?? 1},{' '}
						{countOwnedTiles(pendingImport.tiles)} tiles, {formatTime(pendingImport.playSeconds)} played.
					</div>
					<div className='flex justify-between'>
						<button className='px-btn px-btn-red' disabled={busy} onClick={() => setPendingImport(null)}>
							Cancel
						</button>
						<button className='px-btn' disabled={busy} onClick={confirmImport}>
							Import and reload
						</button>
					</div>
				</div>
			) : confirmReset ? (
				<div className='px-card mb-3 text-sm'>
					<div className='px-h'>Delete all progress?</div>
					<div className='text-[#d8c8a0] mb-3'>This cannot be undone. Export first if you might want it back.</div>
					<div className='flex justify-between'>
						<button className='px-btn' disabled={busy} onClick={() => setConfirmReset(false)}>
							Cancel
						</button>
						<button className='px-btn px-btn-red' disabled={busy} onClick={confirmResetGame}>
							Delete and restart
						</button>
					</div>
				</div>
			) : (
				<div className='flex flex-col gap-3'>
					<button className='px-btn' disabled={busy} onClick={handleExport}>
						Export save
					</button>
					<button className='px-btn' disabled={busy} onClick={() => fileRef.current?.click()}>
						Import save
					</button>
					<input ref={fileRef} type='file' accept='.sav,text/plain' className='hidden' onChange={handleFile} />
					<button className='px-btn px-btn-red' disabled={busy} onClick={() => setConfirmReset(true)}>
						Reset game
					</button>
				</div>
			)}
		</PixelModal>
	);
};

export default SaveMenuDialog;
