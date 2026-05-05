import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  renderHook,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { ItemIcon } from './ItemIcon';
import {
  __resetItemIconCacheForTests,
  canonicalizeId,
  resolveIconUrl,
  useHasIcon,
  useIconChecker,
} from './itemIconUtils';

const SAMPLE_MANIFEST = {
  fish: {
    'sea-bass': 'png',
    'pale-chub': 'png',
  },
  bugs: {
    ant: 'png',
    'citrus-longhorn-beetle': 'png',
  },
  fossils: {
    placeholder: 'png',
    'sabretooth-skull': 'png',
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

describe('resolveIconUrl', () => {
  it('builds a flat URL from manifest extension', () => {
    expect(resolveIconUrl(SAMPLE_MANIFEST, 'fish', 'sea-bass')).toBe(
      '/icons/fish/sea-bass.png'
    );
  });

  it('applies RENAME_OVERRIDES before lookup', () => {
    expect(canonicalizeId('citrus-long-horned-beetle')).toBe(
      'citrus-longhorn-beetle'
    );
    expect(
      resolveIconUrl(SAMPLE_MANIFEST, 'bugs', 'citrus-long-horned-beetle')
    ).toBe('/icons/bugs/citrus-longhorn-beetle.png');
  });

  it('returns null for an id absent from the manifest', () => {
    expect(
      resolveIconUrl(SAMPLE_MANIFEST, 'fish', 'not-a-real-fish')
    ).toBeNull();
  });

  it('falls back to the fossil placeholder for an unknown fossil id', () => {
    expect(resolveIconUrl(SAMPLE_MANIFEST, 'fossils', 'unknown-fossil')).toBe(
      '/icons/fossils/placeholder.png'
    );
  });

  it('returns null for an unknown fossil if no placeholder is committed', () => {
    const manifest = { fossils: {} };
    expect(resolveIconUrl(manifest, 'fossils', 'unknown')).toBeNull();
  });

  it('canonicalizes sabertooth → sabretooth before lookup', () => {
    expect(resolveIconUrl(SAMPLE_MANIFEST, 'fossils', 'sabertooth-skull')).toBe(
      '/icons/fossils/sabretooth-skull.png'
    );
  });
});

describe('ItemIcon', () => {
  it('renders an <img> with the URL constructed from the flat manifest', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    const { container } = render(
      <ItemIcon category="fish" id="sea-bass" size={32} />
    );

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull();
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/icons/fish/sea-bass.png');
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('height')).toBe('32');
    expect(img.getAttribute('alt')).toMatch(/sea bass icon/i);
  });

  it('renders the placeholder when the manifest has no entry for the id', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    render(<ItemIcon category="bugs" id="not-a-real-bug" size={32} />);

    const placeholder = await screen.findByRole('img', {
      name: /not a real bug icon/i,
    });
    expect(placeholder.tagName).toBe('SPAN');
    expect(placeholder.textContent).toBe('NA');
  });

  it('renders the placeholder when the manifest fetch fails (404)', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(null, false));

    render(<ItemIcon category="fish" id="sea-bass" size={32} />);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /sea bass icon/i }).tagName).toBe(
        'SPAN'
      );
    });
  });

  it('falls back to the placeholder when the <img> errors at runtime', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));

    const { container } = render(
      <ItemIcon category="fish" id="sea-bass" size={32} />
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
      vi.fn(() => new Promise(() => {}))
    );

    const { container } = render(
      <ItemIcon category="fish" id="sea-bass" size={48} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
    expect(wrapper.style.position).toBe('relative');
  });
});

describe('manifest cache', () => {
  it('fetches the flat manifest only once across multiple consumers', async () => {
    const fetchMock = mockManifestFetch(SAMPLE_MANIFEST);
    vi.stubGlobal('fetch', fetchMock);

    const a = renderHook(() => useHasIcon('fish', 'sea-bass'));
    const b = renderHook(() => useHasIcon('fish', 'pale-chub'));

    await waitFor(() => expect(a.result.current).toBe(true));
    await waitFor(() => expect(b.result.current).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('useHasIcon / useIconChecker', () => {
  it('useHasIcon returns false during in-flight, true once present', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));
    const { result } = renderHook(() => useHasIcon('fish', 'sea-bass'));
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('useHasIcon honors RENAME_OVERRIDES', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));
    const { result } = renderHook(() =>
      useHasIcon('bugs', 'citrus-long-horned-beetle')
    );
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('useIconChecker returns a predicate keyed on the loaded manifest', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(SAMPLE_MANIFEST));
    const { result } = renderHook(() => useIconChecker());
    await waitFor(() => {
      expect(result.current('fish', 'sea-bass')).toBe(true);
    });
    expect(result.current('fish', 'not-a-real-fish')).toBe(false);
    expect(result.current('bugs', 'citrus-long-horned-beetle')).toBe(true);
  });

  it('useHasIcon stays false when the manifest is absent (404)', async () => {
    vi.stubGlobal('fetch', mockManifestFetch(null, false));
    const { result } = renderHook(() => useHasIcon('fish', 'sea-bass'));
    await waitFor(() => expect(result.current).toBe(false));
  });
});
