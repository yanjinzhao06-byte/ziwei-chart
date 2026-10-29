import { useEffect, useRef } from 'react';

export interface Prefs {
  sound: boolean;
  volume: number;
  motion: 'system' | 'reduced' | 'off';
}

export default function Settings({
  open,
  prefs,
  onChange,
  onClose,
  onReplayIntro,
}: {
  open: boolean;
  prefs: Prefs;
  onChange: (next: Partial<Prefs>) => void;
  onClose: () => void;
  onReplayIntro: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2>设置</h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="关闭设置">
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="setting-row">
            <div className="setting-text">
              <b>声音</b>
              <span>按钮与排盘的提示音，全部本地合成，不联网</span>
            </div>
            <button
              type="button"
              className={`switch ${prefs.sound ? 'on' : ''}`}
              role="switch"
              aria-checked={prefs.sound}
              onClick={() => onChange({ sound: !prefs.sound })}
            >
              <i />
            </button>
          </div>

          <div className={`setting-row ${prefs.sound ? '' : 'muted'}`}>
            <div className="setting-text">
              <b>音量</b>
              <span>{Math.round(prefs.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(prefs.volume * 100)}
              disabled={!prefs.sound}
              style={{ ['--v' as string]: `${Math.round(prefs.volume * 100)}%` }}
              onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
              aria-label="音量"
            />
          </div>

          <div className="setting-row">
            <div className="setting-text">
              <b>动效</b>
              <span>星空与开场动画的强度，默认跟随系统设置</span>
            </div>
            <select
              value={prefs.motion}
              onChange={(e) => onChange({ motion: e.target.value as Prefs['motion'] })}
              aria-label="动效偏好"
            >
              <option value="system">跟随系统</option>
              <option value="reduced">减弱</option>
              <option value="off">关闭</option>
            </select>
          </div>

          <div className="setting-row">
            <div className="setting-text">
              <b>开场动画</b>
              <span>每个标签页只播一次，可手动重看</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onReplayIntro}>
              重播
            </button>
          </div>
        </div>

        <footer className="modal-foot">
          <p>偏好保存在本机，换设备不会同步。</p>
        </footer>
      </div>
    </div>
  );
}
