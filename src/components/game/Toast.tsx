import React from 'react';
import { useUiStore } from '@/stores/uiStore';
import '@/styles/ContextMenu.css';

/** Short messages ("Game saved") under the header; `showToast` in the ui store puts one up for a couple of seconds, and several stack. */
const Toast: React.FC = () => {
	const toasts = useUiStore((state) => state.toasts);
	return (
		<>
			{toasts.map((toast) => (
				<div key={toast.id} className='px-toast ui-toast text-[#ffe27a] text-sm' role='status'>
					{toast.text}
					{toast.count > 1 && <span className='ml-2 text-[#f0d27a] font-semibold'>x{toast.count}</span>}
				</div>
			))}
		</>
	);
};

export default Toast;
