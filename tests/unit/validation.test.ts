import { describe, expect, it } from 'vitest';
import {
  NAME_MAX_LENGTH,
  ROOM_CODE_LENGTH,
  sanitizeName,
  validateColor,
  validateIndex,
  validateName,
  validateNumberList,
  validateRoomCode,
  validateTileNumber,
} from '@noctalis/shared';

describe('validation et nettoyage des entrees', () => {
  it('nettoie les pseudos', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice');
    expect(sanitizeName('A\u0000li\u001fce')).toBe('Alice');
    // Les chevrons disparaissent et le pseudo est tronque a 16 caracteres.
    expect(sanitizeName('<script>alert(1)</script>')).toBe('scriptalert(1)/s');
    expect(sanitizeName('Jean    Pierre')).toBe('Jean Pierre');
    expect(sanitizeName(42)).toBe('');
    expect(sanitizeName('x'.repeat(50))).toHaveLength(NAME_MAX_LENGTH);
  });

  it('valide les pseudos', () => {
    expect(validateName('Alice')).toEqual({ ok: true, value: 'Alice' });
    expect(validateName('A').ok).toBe(false);
    expect(validateName('   ').ok).toBe(false);
    expect(validateName(null).ok).toBe(false);
    expect(validateName('Émile')).toEqual({ ok: true, value: 'Émile' });
  });

  it('valide les codes de room', () => {
    expect(validateRoomCode(' ab7k9 ')).toEqual({ ok: true, value: 'AB7K9' });
    expect(validateRoomCode('AB7K')).toMatchObject({ ok: false });
    expect(validateRoomCode('AB7K90')).toMatchObject({ ok: false });
    expect(validateRoomCode('AB0K9')).toMatchObject({ ok: false });
    expect(validateRoomCode(123).ok).toBe(false);
    expect('AB7K9').toHaveLength(ROOM_CODE_LENGTH);
  });

  it('valide couleurs, numeros et index', () => {
    expect(validateColor('pink')).toEqual({ ok: true, value: 'pink' });
    expect(validateColor('purple').ok).toBe(false);
    expect(validateTileNumber(60)).toEqual({ ok: true, value: 60 });
    expect(validateTileNumber(61).ok).toBe(false);
    expect(validateIndex(5, 6)).toEqual({ ok: true, value: 5 });
    expect(validateIndex(6, 6).ok).toBe(false);
    expect(validateIndex(-1, 6).ok).toBe(false);
  });

  it('valide les listes de numeros', () => {
    expect(validateNumberList([1, 2, 3, 4, 5], 5)).toEqual({ ok: true, value: [1, 2, 3, 4, 5] });
    expect(validateNumberList([1, 2, 3, 4], 5).ok).toBe(false);
    expect(validateNumberList(['1', 2, 3, 4, 5], 5).ok).toBe(false);
    expect(validateNumberList('12345', 5).ok).toBe(false);
  });
});
