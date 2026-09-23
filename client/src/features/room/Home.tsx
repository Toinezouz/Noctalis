import { useState, type FormEvent } from 'react';
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, ROOM_CODE_LENGTH, validateName } from '@gotfive/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Field } from '../../components/ui/Field.js';
import { LanguageSwitch } from '../../components/ui/LanguageSwitch.js';
import { ThemeSwitch } from '../../components/ui/ThemeSwitch.js';
import type { ThemePreference } from '../../lib/theme.js';
import { errorMessageKey, useGame } from '../../app/GameContext.js';

export interface HomeProps {
  initialName: string;
  onNameChange: (name: string) => void;
  onOpenHelp: () => void;
  theme: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
}

type Mode = 'menu' | 'create' | 'join';

/** Ecran d'accueil : creer ou rejoindre une partie, et apprendre a jouer. */
export function Home({
  initialName,
  onNameChange,
  onOpenHelp,
  theme,
  onThemeChange,
}: HomeProps): JSX.Element {
  const { actions, status } = useGame();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('menu');
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    const checked = validateName(name);
    if (!checked.ok) {
      setError(
        `${t('error.INVALID_NAME')} ${t('home.nameHint', {
          min: NAME_MIN_LENGTH,
          max: NAME_MAX_LENGTH,
        })}`,
      );
      return;
    }
    onNameChange(checked.value);
    setBusy(true);
    try {
      const result =
        mode === 'create'
          ? await actions.createRoom(checked.value)
          : await actions.joinRoom(checked.value, code);
      if (!result.ok) {
        setError(t(result.errorCode ? errorMessageKey(result.errorCode) : 'error.WRONG_PHASE'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="home">
      <div className="home__hero">
        <div className="home__rays" aria-hidden="true" />
        <h1 className="brand brand--xl">
          GOT <em>FIVE!</em>
        </h1>
        <p className="home__tagline">{t('home.tagline')}</p>
        <p className="home__sub muted">{t('home.pitch')}</p>
      </div>

      <div className="home__card panel">
        {mode === 'menu' ? (
          <div className="stack">
            <Button
              size="lg"
              variant="primary"
              block
              data-testid="menu-create"
              onClick={() => {
                setMode('create');
              }}
            >
              {t('home.create')}
            </Button>
            <Button
              size="lg"
              block
              data-testid="menu-join"
              onClick={() => {
                setMode('join');
              }}
            >
              {t('home.join')}
            </Button>
            <Button size="lg" variant="secondary" block onClick={onOpenHelp} data-testid="menu-help">
              {t('home.help')}
            </Button>
            <p className="center muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
              {status === 'online' ? t('home.connected') : t('home.connecting')}
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={(event) => void submit(event)}>
            <h2 style={{ marginBottom: 0 }}>
              {mode === 'create' ? t('home.createTitle') : t('home.joinTitle')}
            </h2>
            <Field
              label={t('home.nameLabel')}
              value={name}
              maxLength={NAME_MAX_LENGTH}
              autoFocus
              data-testid="name-input"
              hint={t('home.nameHint', { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH })}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
            {mode === 'join' ? (
              <Field
                label={t('home.codeLabel')}
                value={code}
                maxLength={ROOM_CODE_LENGTH}
                data-testid="code-input"
                placeholder="AB7K9"
                autoCapitalize="characters"
                hint={t('home.codeHint', { length: ROOM_CODE_LENGTH })}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                }}
              />
            ) : null}
            {error ? (
              <p className="field__error" role="alert" data-testid="home-error">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              block
              disabled={busy}
              data-testid="submit-room"
            >
              {busy
                ? t('common.loading')
                : mode === 'create'
                  ? t('home.submitCreate')
                  : t('home.submitJoin')}
            </Button>
            <Button
              variant="secondary"
              block
              onClick={() => {
                setMode('menu');
                setError(null);
              }}
            >
              {t('common.back')}
            </Button>
          </form>
        )}
      </div>

      <div className="home__prefs">
        <LanguageSwitch />
        <ThemeSwitch value={theme} onChange={onThemeChange} />
      </div>
    </div>
  );
}
