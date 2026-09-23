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

describe('Choix du theme (composant)', () => {
  it('propose les trois choix et marque celui qui est actif', () => {
    show('dark');
    expect(screen.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('theme-light')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');
  });

  it('remonte le choix du joueur', async () => {
    const onChange = vi.fn();
    show('auto', onChange);
    await userEvent.click(screen.getByTestId('theme-dark'));
    expect(onChange).toHaveBeenCalledWith('dark');
    await userEvent.click(screen.getByTestId('theme-light'));
    expect(onChange).toHaveBeenLastCalledWith('light');
  });

  it('reste utilisable au clavier et porte des libelles traduits', () => {
    show('auto');
    expect(screen.getByRole('group', { name: 'Thème' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automatique/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clair/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sombre/ })).toBeInTheDocument();
  });

  it('en version compacte, un seul bouton fait defiler les trois choix', async () => {
    const onChange = vi.fn();
    show('auto', onChange, true);
    const button = screen.getByTestId('theme-cycle');
    // Le bouton annonce l'etat courant : indispensable sans libelle visible.
    expect(button).toHaveAccessibleName('Thème : Automatique. Cliquer pour changer.');
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('light');
    // Les trois pastilles n'encombrent pas le bandeau de jeu.
    expect(screen.queryByTestId('theme-dark')).toBeNull();
  });

  it('applique le theme au document et a la barre du navigateur', () => {
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
