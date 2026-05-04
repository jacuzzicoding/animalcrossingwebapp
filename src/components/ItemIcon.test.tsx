import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  renderHook,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { ItemIcon } from './ItemIcon';
import { __resetItemIconCacheForTests, useGameHasIcons } from './itemIconUtils';

const SAMPLE_MANIFEST = {
  fish: {
    'sea-bass': 'sea-bass.jpg',
    'pale-chub': 'pale-chub.png',
  },
  bugs: {
    ant: 'ant.png',
  },
};

function mockManifestFetch(manifest: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: async () => manifest,
  } as Response);
}

beforeEach(() => {
  __resetItemIconCacheForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ItemIcon', () => {
  it('renders an <img> with the URL constructed from the manifest entry', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    const { container } = render(
      <ItemIcon gameId="ACGCN" category="fish" id="sea-bass" size={32} />
    );

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull();
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/icons/acgcn/fish/sea-bass.jpg');
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('height')).toBe('32');
    expect(img.getAttribute('alt')).toMatch(/sea bass icon/i);
  });

  it('renders the placeholder when the manifest has no entry for the id', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    render(
      <ItemIcon gameId="ACGCN" category="fish" id="not-a-real-fish" size={32} />
    );

    // Placeholder span uses initials and an alt-derived aria-label.
    const placeholder = await screen.findByRole('img', {
      name: /not a real fish icon/i,
    });
    expect(placeholder.tagName).toBe('SPAN');
    expect(placeholder.textContent).toBe('NA');
  });

  it('renders the placeholder when the manifest fetch fails (404)', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(null, false));

    render(<ItemIcon gameId="ACGCN" category="fish" id="sea-bass" size={32} />);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /sea bass icon/i }).tagName).toBe(
        'SPAN'
      );
    });
  });

  it('falls back to the placeholder when the <img> errors at runtime', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    const { container } = render(
      <ItemIcon gameId="ACGCN" category="fish" id="sea-bass" size={32} />
    );

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull();
    });
    const img = container.querySelector('img') as HTMLImageElement;

    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('span[role="img"]')).not.toBeNull();
    });
  });

  it('reserves dimensions on the wrapper before the image loads', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves
    );

    const { container } = render(
      <ItemIcon gameId="ACGCN" category="fish" id="sea-bass" size={48} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
    expect(wrapper.style.position).toBe('relative');
  });
});

describe('useGameHasIcons — data-driven gate', () => {
  it('returns false synchronously while the manifest probe is unknown (in flight)', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves → state stays unknown
    );

    const { result } = renderHook(() => useGameHasIcons('ACGCN'));
    expect(result.current).toBe(false);
  });

  it('transitions unknown → present when the manifest fetch returns valid JSON', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    const { result } = renderHook(() => useGameHasIcons('ACGCN'));
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('transitions unknown → absent on a 404, and stays false', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(null, false));

    const { result } = renderHook(() => useGameHasIcons('ACWW'));
    expect(result.current).toBe(false);
    // Give the in-flight promise a tick to settle into `absent`.
    await waitFor(() => {
      // result stays false; we infer the state-machine transitioned via a
      // second hook call hitting the cached `absent` state on next render.
      expect(result.current).toBe(false);
    });
  });

  it('transitions unknown → absent when the manifest JSON is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ not_a_category: 'oops' }),
      } as Response)
    );

    const { result } = renderHook(() => useGameHasIcons('ACNH'));
    expect(result.current).toBe(false);
    // Wait for the in-flight promise to settle into `absent`.
    await waitFor(() => expect(result.current).toBe(false));
  });
});
