import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  ArrowLeft,
  CircleHelp,
  Maximize2,
  Minimize2,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  Video,
} from 'lucide-react';

type PrompterMode = 'edit' | 'prepared' | 'running' | 'paused' | 'ended';

function App() {
  const [script, setScript] = useState('');
  const [speed, setSpeed] = useState(34);
  const [mode, setMode] = useState<PrompterMode>('edit');
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emptyNotice, setEmptyNotice] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const startOffsetRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedMinutes = wordCount ? Math.max(1, Math.ceil(wordCount / speed)) : 0;
  const canPrepare = script.trim().length > 0;

  useEffect(() => {
    document.title = 'Sprechraum — Teleprompter';
  }, []);

  useEffect(() => {
    if (mode !== 'prepared') return;
    const initialOffset = (stageRef.current?.clientHeight ?? 420) + 56;
    offsetRef.current = initialOffset;
    startOffsetRef.current = initialOffset;
    setOffset(initialOffset);
    setProgress(0);
  }, [mode]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (mode !== 'running') {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const tick = (time: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = time;
      const delta = Math.min((time - lastFrameRef.current) / 1000, 0.08);
      lastFrameRef.current = time;
      const stageHeight = stageRef.current?.clientHeight ?? 420;
      const contentHeight = scriptRef.current?.scrollHeight ?? 500;
      const pixelsPerWord = contentHeight / Math.max(wordCount, 1);
      const nextOffset = offsetRef.current - (pixelsPerWord * speed / 60) * delta;
      const totalDistance = stageHeight + 56 + contentHeight;
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
      setProgress(Math.min(100, Math.max(0, ((startOffsetRef.current - nextOffset) / totalDistance) * 100)));

      if (nextOffset <= -contentHeight - 8) {
        setMode('ended');
        setProgress(100);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
    };
  }, [mode, speed]);

  const prepare = () => {
    if (!canPrepare) {
      setEmptyNotice(true);
      return;
    }
    setEmptyNotice(false);
    setMode('prepared');
  };

  const startOrPrepare = () => {
    if (mode === 'edit') {
      prepare();
    } else if (mode === 'prepared') {
      setMode('running');
    } else if (mode === 'paused') {
      setMode('running');
    } else if (mode === 'running') {
      setMode('paused');
    } else if (mode === 'ended') {
      setMode('prepared');
    }
  };

  const togglePlayback = useCallback(() => {
    if (mode === 'running') setMode('paused');
    else if (mode === 'paused') setMode('running');
    else if (mode === 'ended') setMode('prepared');
  }, [mode]);

  const returnToEdit = () => {
    setMode('edit');
    setProgress(0);
    setEmptyNotice(false);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await shellRef.current?.requestFullscreen();
      } catch {
        setIsFullscreen(false);
      }
    } else {
      await document.exitFullscreen();
    }
  };

  const handleStageKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && (mode === 'running' || mode === 'paused' || mode === 'ended')) {
      event.preventDefault();
      togglePlayback();
    }
  };

  const modeLabel = {
    edit: 'Bereit zum Einrichten',
    prepared: 'Text vorbereitet',
    running: 'Laufend',
    paused: 'Pausiert',
    ended: 'Sendung beendet',
  }[mode];

  const mainButtonLabel = {
    edit: 'Text vorbereiten',
    prepared: 'Lauf starten',
    running: 'Lauf pausieren',
    paused: 'Weiterlesen',
    ended: 'Noch einmal lesen',
  }[mode];

  return (
    <div className={`app-shell${isFullscreen ? ' fullscreen' : ''}`} ref={shellRef}>
      <header className="topbar">
        <div className="brand-lockup" aria-label="Sprechraum Teleprompter">
          <div className="brand-mark"><Video size={16} strokeWidth={1.7} /></div>
          <div>
            <div className="brand-name">Sprechraum</div>
            <div className="brand-sub">Teleprompter · Studio 01</div>
          </div>
        </div>
        <div className="top-status" aria-live="polite" data-testid="status-mode">
          <span className={`status-dot${mode === 'running' ? ' live' : ''}`} />
          {modeLabel}
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="eyebrow">Sendungsregie / Teleprompter</div>
            <h1>Gute Worte. Ruhig im Blick.</h1>
            <p>Vorbereiten, einrichten, sprechen — in Ihrem Tempo.</p>
          </div>
          <div className="heading-meta">LOKAL IM BROWSER<br />KEINE AUFZEICHNUNG</div>
        </div>

        <div className="editor-layout">
          <section className="panel script-panel" aria-labelledby="script-heading">
            <div className="panel-head">
              <div className="panel-label" id="script-heading"><AlignLeft size={15} /> Manuskript</div>
              <div className="panel-note">NUR FÜR DIESEN LAUF</div>
            </div>
            <textarea
              className="script-field"
              aria-label="Manuskript eingeben"
              data-testid="script-input"
              placeholder="Fügen Sie hier Ihr Manuskript ein …"
              value={script}
              onChange={(event) => {
                setScript(event.target.value);
                if (emptyNotice) setEmptyNotice(false);
              }}
              readOnly={mode !== 'edit'}
              spellCheck
            />
            <div className="script-footer">
              <span data-testid="word-count">{wordCount} Wörter</span>
              <span>{estimatedMinutes ? `Ca. ${estimatedMinutes} Min. bei aktuellem Tempo` : 'Ihr Text bleibt auf diesem Gerät'}</span>
            </div>
          </section>

          <aside className="side-stack" aria-label="Laufsteuerung">
            <section className="panel control-panel">
              <div className="control-title"><span>Lesetempo</span><span>WÖRTER / MIN.</span></div>
              <div className="speed-readout">
                <span className="speed-value" aria-live="polite" data-testid="speed-value">{speed}</span>
                <span className="speed-unit">Wörter pro Minute</span>
              </div>
              <input
                className="range-input"
                type="range"
                min="12"
                max="250"
                step="1"
                value={speed}
                aria-label="Lesetempo in Wörtern pro Minute"
                data-testid="speed-control"
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
              <div className="range-labels"><span>LANGSAM</span><span>FLIESSEND</span><span>SCHNELL</span></div>
              <div className="control-divider" />
              <div className="hint-row"><CircleHelp size={15} /><span>Das Tempo lässt sich jederzeit anpassen — auch während des Laufs.</span></div>
            </section>

            <section className="panel control-panel">
              <div className="control-title">
                <span>{mode === 'prepared' ? 'Lauf starten' : 'Start vorbereiten'}</span>
                <span>{mode === 'prepared' ? 'SCHRITT 02 / 02' : 'SCHRITT 01 / 02'}</span>
              </div>
              {emptyNotice && <div className="empty-warning" role="alert">Bitte geben Sie zuerst ein Manuskript ein.</div>}
              <div className="button-row">
                {mode !== 'edit' && (
                  <button className="button button-quiet" type="button" onClick={returnToEdit} aria-label="Zur Manuskriptbearbeitung" data-testid="edit-script">
                    <ArrowLeft size={15} /> Bearbeiten
                  </button>
                )}
                <button
                  className="button button-primary"
                  type="button"
                  onClick={startOrPrepare}
                  data-testid="start-button"
                >
                  {mode === 'running' ? <Pause size={15} /> : <Play size={15} />}
                  {mainButtonLabel}
                </button>
              </div>
              <div className="key-hint">Erst vorbereiten, dann starten <kbd>2 Schritte</kbd></div>
            </section>
          </aside>
        </div>

        <section className="stage" ref={stageRef} aria-label="Teleprompter Lesebereich">
          <div className="stage-topline">
            <span className="stage-pip">{mode === 'running' ? 'ON AIR' : 'LESEFENSTER'}</span>
            <span>{mode === 'edit' ? 'VORSCHAU' : modeLabel.toUpperCase()}</span>
          </div>
          <div
            className="reading-window"
            role="button"
            tabIndex={mode === 'running' || mode === 'paused' || mode === 'ended' ? 0 : -1}
            aria-label={mode === 'running' ? 'Lauf pausieren' : 'Lauf fortsetzen'}
            aria-pressed={mode === 'paused'}
            onClick={togglePlayback}
            onKeyDown={handleStageKeyDown}
            data-testid="reading-area"
          >
            {mode === 'edit' && (
              <div className="stage-center-state">
                <div className="center-symbol"><MonitorPlay size={21} strokeWidth={1.5} /></div>
                <strong>Ihr Lesefenster wartet.</strong>
                <span>Geben Sie Ihr Manuskript ein und wählen Sie „Text vorbereiten“, um den Lauf einzurichten.</span>
              </div>
            )}
            {mode === 'prepared' && (
              <div className="stage-center-state">
                <div className="center-symbol"><Play size={20} strokeWidth={1.5} /></div>
                <strong>Alles bereit für den Lauf.</strong>
                <span>Der Text startet unterhalb des Lesefensters. Mit dem zweiten Klick beginnt der Lauf.</span>
              </div>
            )}
            {(mode === 'prepared' || mode === 'running' || mode === 'paused' || mode === 'ended') && (
              <div
                className="script-scroll"
                ref={scriptRef}
                style={{ transform: `translateY(${offset}px)` }}
              >
                {script.trim()}
              </div>
            )}
            {mode === 'paused' && (
              <div className="stage-center-state">
                <div className="center-symbol"><Play size={20} strokeWidth={1.5} /></div>
                <strong>Pausiert</strong>
                <span>Klicken Sie in den Lesebereich oder drücken Sie die Eingabetaste, um fortzufahren.</span>
              </div>
            )}
            {mode === 'ended' && (
              <div className="stage-center-state">
                <div className="center-symbol"><RotateCcw size={19} strokeWidth={1.5} /></div>
                <strong>Das Manuskript ist zu Ende.</strong>
                <span>Der Lauf kann erneut vorbereitet werden — oder Sie kehren zur Bearbeitung zurück.</span>
              </div>
            )}
          </div>
          <div className="stage-bottomline">
            <span>{mode === 'running' ? `${Math.round(progress)} % DURCHLAUF` : mode === 'edit' ? 'SCHWARZER HINTERGRUND · WEISSE SCHRIFT' : 'KLICK ZUM PAUSIEREN / FORTSETZEN'}</span>
            <div className="stage-controls">
              {(mode === 'prepared' || mode === 'running' || mode === 'paused' || mode === 'ended') && (
          <button
                  className="icon-button"
                  type="button"
                  aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
                  title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
            onClick={(event) => {
              event.stopPropagation();
              void toggleFullscreen();
            }}
                  data-testid="fullscreen-button"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              )}
            </div>
          </div>
          {(mode === 'running' || mode === 'paused' || mode === 'ended') && (
            <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          )}
        </section>
        {mode === 'prepared' && (
          <div className="ready-banner" role="status">
            <strong>Manuskript vorbereitet.</strong>
            <span>Der erste Klick richtet den Text ein. Klicken Sie jetzt auf „Lauf starten“.</span>
          </div>
        )}
        <div className="footer-note">
          <span>SPRECHRAUM · EIN RUHIGER MOMENT VOR DER SENDUNG</span>
          <span>BEDIENUNG: KLICK IM LESEFENSTER PAUSIERT DEN LAUF</span>
        </div>
      </main>
    </div>
  );
}

export default App;
