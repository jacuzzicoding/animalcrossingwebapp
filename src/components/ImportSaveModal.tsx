import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { useUIStore } from '../lib/uiStore';
import { GAMES } from '../lib/types';
import { useMuseumData } from '../hooks/useMuseumData';
import { parseSaveFile, formatParseError } from '../lib/saveFileImport';
import {
  buildImportPlan,
  findCandidateMatch,
  type ImportPlan,
  type ReconcileMode,
} from '../lib/saveFileReconcile';
import type { SaveFileV1 } from '../lib/saveFile';
import type { Town } from '../lib/store';
import type { AllData } from '../lib/viewTypes';
import type { CategoryId } from '../lib/types';

const CATEGORY_KEYS: CategoryId[] = [
  'fish',
  'bugs',
  'fossils',
  'art',
  'sea_creatures',
];

function collectKnownIds(data: AllData): Set<string> {
  const ids = new Set<string>();
  for (const cat of CATEGORY_KEYS) {
    for (const item of data[cat] ?? []) ids.add(item.id);
  }
  return ids;
}

export function ImportSaveModal() {
  const open = useUIStore(s => s.importSaveOpen);
  const close = useUIStore(s => s.closeImportSave);
  const towns = useAppStore(s => s.towns);
  const donatedAt = useAppStore(s => s.donatedAt);
  const applyImportedSave = useAppStore(s => s.applyImportedSave);
  const navigate = useNavigate();

  const [file, setFile] = useState<SaveFileV1 | null>(null);
  const [parseWarn, setParseWarn] = useState<{
    droppedMalformedRows: number;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReconcileMode>('create');
  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmAck, setConfirmAck] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Match candidate (existing town with same name + gameId)
  const candidate: Town | null = useMemo(
    () => (file ? findCandidateMatch(towns, file) : null),
    [file, towns]
  );

  // When the file (and therefore candidate) changes, choose a sensible default mode.
  useEffect(() => {
    if (!file) return;
    setMode(candidate ? 'replace' : 'create');
    setConfirmStep(false);
    setConfirmAck(false);
  }, [file, candidate]);

  // Reset everything when the modal closes.
  useEffect(() => {
    if (open) return;
    setFile(null);
    setParseWarn(null);
    setParseError(null);
    setMode('create');
    setConfirmStep(false);
    setConfirmAck(false);
  }, [open]);

  // Esc to close (when not mid-confirm).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Load data files for the imported gameId so we can drop unknown itemIds.
  const { data, loading: dataLoading } = useMuseumData(
    file?.town.gameId ?? 'ACGCN'
  );
  const knownIds = useMemo(() => collectKnownIds(data), [data]);

  // Donation count we'd be wiping if Replace targets the candidate.
  const candidateDonationCount = useMemo(() => {
    if (!candidate) return 0;
    const m = donatedAt[candidate.id]?.[candidate.gameId] ?? {};
    return Object.keys(m).length;
  }, [candidate, donatedAt]);

  if (!open) return null;

  function handleFile(input: File) {
    setParseError(null);
    setParseWarn(null);
    setFile(null);
    input
      .text()
      .then(text => {
        const result = parseSaveFile(text);
        if (!result.ok) {
          setParseError(formatParseError(result.error));
          return;
        }
        setFile(result.file);
        setParseWarn(result.warnings);
      })
      .catch(err => {
        setParseError(
          err instanceof Error ? err.message : 'Could not read file.'
        );
      });
  }

  function buildPlan(): ImportPlan | null {
    if (!file) return null;
    const existingDonatedAt = candidate
      ? (donatedAt[candidate.id]?.[candidate.gameId] ?? {})
      : {};
    return buildImportPlan({
      file,
      mode,
      existing: candidate,
      existingDonatedAt,
      knownItemIds: knownIds,
    });
  }

  function handlePrimary() {
    if (!file) return;
    // Replace into a town with data → require the heavy two-step gate.
    if (mode === 'replace' && candidateDonationCount > 0 && !confirmStep) {
      setConfirmStep(true);
      return;
    }
    const plan = buildPlan();
    if (!plan) return;
    const townId = applyImportedSave(plan);
    close();
    if (townId) navigate(`/town/${townId}/home`);
  }

  function handleScrim() {
    if (confirmStep) return;
    close();
  }

  // ── Render branches ────────────────────────────────────────────────────────

  const showFilePicker = !file && !parseError;

  return (
    <div className="ac-im-scrim" onClick={handleScrim}>
      <aside
        className="ac-im-modal"
        role="dialog"
        aria-label="Import save"
        onClick={e => e.stopPropagation()}
      >
        <header className="ac-im-head">
          <div>
            <div className="ac-im-eyebrow">Save file</div>
            <h2 className="ac-im-title">Import save</h2>
          </div>
          <button className="ac-im-close" onClick={close} aria-label="Close">
            ×
          </button>
        </header>

        {showFilePicker && (
          <div className="ac-im-body">
            <p className="ac-im-help">
              Choose a <code>.json</code> save file exported from Museum
              Tracker. Donations and town details will be reconstructed from the
              file.
            </p>
            <button
              className="ac-im-cta"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                // Allow re-selecting the same file later.
                e.target.value = '';
              }}
            />
          </div>
        )}

        {parseError && (
          <div className="ac-im-body">
            <div className="ac-im-error">{parseError}</div>
            <button
              className="ac-im-cta-secondary"
              onClick={() => {
                setParseError(null);
                setFile(null);
              }}
            >
              Try a different file
            </button>
          </div>
        )}

        {file && !parseError && !confirmStep && (
          <div className="ac-im-body">
            <PreviewCard
              file={file}
              candidate={candidate}
              warnings={parseWarn}
              dataLoading={dataLoading}
              knownIds={knownIds}
            />

            {candidate ? (
              <ModeSelector mode={mode} setMode={setMode} />
            ) : (
              <p className="ac-im-help" style={{ marginTop: 12 }}>
                No existing town matches <strong>{file.town.name}</strong> on{' '}
                {GAMES[file.town.gameId].shortName}. A new town will be created.
              </p>
            )}

            <div className="ac-im-actions">
              <button className="ac-im-cta-secondary" onClick={close}>
                Cancel
              </button>
              <button
                className={
                  mode === 'replace' && candidateDonationCount > 0
                    ? 'ac-im-cta ac-im-cta-danger'
                    : 'ac-im-cta'
                }
                onClick={handlePrimary}
                disabled={dataLoading}
              >
                {mode === 'replace'
                  ? candidateDonationCount > 0
                    ? 'Replace…'
                    : 'Replace'
                  : mode === 'merge'
                    ? 'Merge'
                    : candidate
                      ? 'Import as new town'
                      : 'Import'}
              </button>
            </div>
          </div>
        )}

        {file && confirmStep && candidate && (
          <div className="ac-im-body">
            <div className="ac-im-danger-panel">
              <div className="ac-im-danger-title">YOU CAN NOT GO BACK.</div>
              <p>
                Replacing <strong>{candidate.name}</strong> will permanently
                delete <strong>{candidateDonationCount}</strong> existing
                donation
                {candidateDonationCount === 1 ? '' : 's'} for this town. This
                cannot be undone.
              </p>
              <label className="ac-im-danger-ack">
                <input
                  type="checkbox"
                  checked={confirmAck}
                  onChange={e => setConfirmAck(e.target.checked)}
                />
                <span>
                  I understand this will erase my existing donation history.
                </span>
              </label>
            </div>
            <div className="ac-im-actions">
              <button
                className="ac-im-cta-secondary"
                onClick={() => {
                  setConfirmStep(false);
                  setConfirmAck(false);
                }}
              >
                Back
              </button>
              <button
                className="ac-im-cta ac-im-cta-danger"
                onClick={() => {
                  if (!confirmAck) return;
                  const plan = buildPlan();
                  if (!plan) return;
                  const townId = applyImportedSave(plan);
                  close();
                  if (townId) navigate(`/town/${townId}/home`);
                }}
                disabled={!confirmAck}
              >
                Replace donations
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function PreviewCard({
  file,
  candidate,
  warnings,
  dataLoading,
  knownIds,
}: {
  file: SaveFileV1;
  candidate: Town | null;
  warnings: { droppedMalformedRows: number } | null;
  dataLoading: boolean;
  knownIds: Set<string>;
}) {
  const game = GAMES[file.town.gameId];
  const droppedUnknown = useMemo(() => {
    if (dataLoading) return null;
    let n = 0;
    for (const d of file.donations) if (!knownIds.has(d.itemId)) n += 1;
    return n;
  }, [file, knownIds, dataLoading]);

  return (
    <div className="ac-im-preview">
      <div className="ac-im-preview-head">
        <div className="ac-im-preview-name">{file.town.name}</div>
        <div className="ac-im-preview-meta">
          <span className="ac-im-badge">{game.shortName}</span>
          {file.town.hemisphere && (
            <>
              <span className="ac-im-dot">·</span>
              <span>Hem. {file.town.hemisphere}</span>
            </>
          )}
          <span className="ac-im-dot">·</span>
          <span>
            {file.donations.length} donation
            {file.donations.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <dl className="ac-im-preview-list">
        <div>
          <dt>Exported</dt>
          <dd>{new Date(file.exportedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>App version</dt>
          <dd>{file.appVersion}</dd>
        </div>
        {candidate && (
          <div>
            <dt>Match</dt>
            <dd>
              Existing town &ldquo;{candidate.name}&rdquo; ({game.shortName})
            </dd>
          </div>
        )}
      </dl>
      {(warnings?.droppedMalformedRows ?? 0) > 0 && (
        <div className="ac-im-warn">
          {warnings!.droppedMalformedRows} donation row
          {warnings!.droppedMalformedRows === 1 ? '' : 's'} were malformed and
          will be skipped.
        </div>
      )}
      {droppedUnknown !== null && droppedUnknown > 0 && (
        <div className="ac-im-warn">
          {droppedUnknown} donation
          {droppedUnknown === 1 ? '' : 's'} reference items not in the current
          data files and will be dropped.
        </div>
      )}
    </div>
  );
}

function ModeSelector({
  mode,
  setMode,
}: {
  mode: ReconcileMode;
  setMode: (m: ReconcileMode) => void;
}) {
  return (
    <fieldset className="ac-im-modes">
      <legend className="ac-im-modes-legend">A matching town exists</legend>
      <label
        className={
          mode === 'replace' ? 'ac-im-mode ac-im-mode-on' : 'ac-im-mode'
        }
      >
        <input
          type="radio"
          name="mode"
          checked={mode === 'replace'}
          onChange={() => setMode('replace')}
        />
        <div>
          <div className="ac-im-mode-name">Replace</div>
          <div className="ac-im-mode-sub">
            Wipe the existing donations and write the imported set.
          </div>
        </div>
      </label>
      <label
        className={mode === 'merge' ? 'ac-im-mode ac-im-mode-on' : 'ac-im-mode'}
      >
        <input
          type="radio"
          name="mode"
          checked={mode === 'merge'}
          onChange={() => setMode('merge')}
        />
        <div>
          <div className="ac-im-mode-name">Merge</div>
          <div className="ac-im-mode-sub">
            Union of donations. On collision the earlier date wins.
          </div>
        </div>
      </label>
      <label
        className={
          mode === 'create' ? 'ac-im-mode ac-im-mode-on' : 'ac-im-mode'
        }
      >
        <input
          type="radio"
          name="mode"
          checked={mode === 'create'}
          onChange={() => setMode('create')}
        />
        <div>
          <div className="ac-im-mode-name">Import as new town</div>
          <div className="ac-im-mode-sub">
            Leave the existing town alone and add a new one.
          </div>
        </div>
      </label>
    </fieldset>
  );
}

export default ImportSaveModal;
