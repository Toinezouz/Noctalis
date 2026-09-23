import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../client/src/i18n/index.js';
import { ThemeSwitch } from '../../client/src/components/ui/ThemeSwitch.js';
import { applyTheme, THEME_COLORS } from '../../client/src/lib/theme.js';
import type { ThemePreference } from '../../client/src/lib/theme.js';

function show(value: ThemePreference, onChange = (): void => {}, compact = false): void {
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
  it('offers the three choices and marks the active one', () => {
    show('dark');
    expect(screen.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('theme-light')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports the player\'s choice', async () => {
    const onChange = vi.fn();
    show('auto', onChange);
    await userEvent.click(screen.getByTestId('theme-dark'));
    expect(onChange).toHaveBeenCalledWith('dark');
    await userEvent.click(screen.getByTestId('theme-light'));
    expect(onChange).toHaveBeenLastCalledWith('light');
  });

  it('works with the keyboard and carries translated labels', () => {
    show('auto');
    expect(screen.getByRole('group', { name: 'Thème' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automatique/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clair/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sombre/ })).toBeInTheDocument();
  });

  it('in its compact form, one button cycles through the three choices', async () => {
    const onChange = vi.fn();
    show('auto', onChange, true);
    const button = screen.getByTestId('theme-cycle');
    // The button announces the current state: essential without a visible label.
    expect(button).toHaveAccessibleName('Thème : Automatique. Cliquer pour changer.');
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('light');
    // The three pills do not clutter the game header.
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
});
