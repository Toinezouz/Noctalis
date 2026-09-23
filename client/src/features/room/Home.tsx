import { useState, type FormEvent } from 'react';
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, ROOM_CODE_LENGTH, validateName } from '@noctalis/shared';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../../components/ui/Button.js';
import { Field } from '../../components/ui/Field.js';
import { LanguageSwitch } from '../../components/ui/LanguageSwitch.js';
import { ThemeSwitch } from '../../components/ui/ThemeSwitch.js';
import { BrandMark } from '../../components/ui/BrandMark.js';
import { Astrolabe } from '../../components/ui/Astrolabe.js';
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

/** Home screen: start or join a game, and learn how to play. */
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
        <Astrolabe />
        <BrandMark size="xl" as="h1" />
        <p className="home__tagline">{t('home.tagline')}</p>
        <p className="home__sub">{t('home.pitch')}</p>
        <p className="home__players">{t('home.players')}</p>
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
            <p className={`home__status ${status === 'online' ? 'is-online' : ''}`.trim()}>
              <span className="home__status-dot" aria-hidden="true" />
              {status === 'online' ? t('home.connected') : t('home.connecting')}
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={(event) => void submit(event)}>
            <h2 className="home__form-title">
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
