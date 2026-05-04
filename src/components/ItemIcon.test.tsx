import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ItemIcon } from './ItemIcon';
import { __resetItemIconCacheForTests } from './itemIconUtils';

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
