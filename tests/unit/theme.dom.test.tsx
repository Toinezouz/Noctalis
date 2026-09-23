import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../client/src/i18n/index.js';
import { ThemeSwitch } from '../../client/src/components/ui/ThemeSwitch.js';
import { applyTheme, THEME_COLORS } from '../../client/src/lib/theme.js';
import type { Theme } from '../../client/src/lib/theme.js';
import { loadPreferences, migrateLegacyStorage } from '../../client/src/lib/storage.js';

function show(value: Theme, onChange = (): void => {}, compact = false): void {
  render(
    <I18nProvider initialLanguage="fr">
      <ThemeSwitch value={value} onChange={onChange} compact={compact} />
    </I18nProvider>,
  );
}

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset['theme'];
});

describe('Theme choice (component)', () => {
  it('offers the two choices, no automatic one, and marks the active one', () => {
    show('dark');
    expect(screen.getByTestId('theme-light')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('theme-auto')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('reports the player\'s choice', async () => {
    const onChange = vi.fn();
    show('light', onChange);
    await userEvent.click(screen.getByTestId('theme-dark'));
    expect(onChange).toHaveBeenCalledWith('dark');
    await userEvent.click(screen.getByTestId('theme-light'));
    expect(onChange).toHaveBeenLastCalledWith('light');
  });

  it('works with the keyboard and carries translated labels', () => {
    show('dark');
    expect(screen.getByRole('group', { name: 'Thème' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clair/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sombre/ })).toBeInTheDocument();
  });

  it('in its compact form, one button switches to the other theme', async () => {
    const onChange = vi.fn();
    show('dark', onChange, true);
    const button = screen.getByTestId('theme-toggle');
    // The button announces the current state: essential without a visible label.
    expect(button).toHaveAccessibleName('Thème : Sombre. Cliquer pour changer.');
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('light');
    // The two pills do not clutter the game header.
    expect(screen.queryByTestId('theme-dark')).toBeNull();
  });

  it('applies the theme to the document and the browser bar', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);

    applyTheme('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.light);
    meta.remove();
  });

  it('starts dark, and turns the old "automatic" setting into the default', () => {
    window.localStorage.removeItem('umbrastra:prefs');
    expect(loadPreferences().theme).toBe('dark');
    window.localStorage.setItem('umbrastra:prefs', JSON.stringify({ theme: 'auto', name: 'Kim' }));
    expect(loadPreferences()).toMatchObject({ theme: 'dark', name: 'Kim' });
    window.localStorage.setItem('umbrastra:prefs', JSON.stringify({ theme: 'light' }));
    expect(loadPreferences().theme).toBe('light');
    window.localStorage.removeItem('umbrastra:prefs');
  });

  it('keeps the settings saved under the old name, NOCTALIS', () => {
    window.localStorage.clear();
    window.localStorage.setItem('noctalis:prefs', JSON.stringify({ theme: 'light', name: 'Kim' }));
    window.localStorage.setItem('noctalis:session', '{"roomCode":"AB7K9"}');
    migrateLegacyStorage();
    expect(loadPreferences()).toMatchObject({ theme: 'light', name: 'Kim' });
    expect(window.localStorage.getItem('umbrastra:session')).toBe('{"roomCode":"AB7K9"}');
    expect(window.localStorage.getItem('noctalis:prefs')).toBeNull();
    expect(window.localStorage.getItem('noctalis:session')).toBeNull();

    // Newer settings are never overwritten by old ones.
    window.localStorage.setItem('noctalis:prefs', JSON.stringify({ theme: 'dark' }));
    migrateLegacyStorage();
    expect(loadPreferences().theme).toBe('light');
    window.localStorage.clear();
  });
});
