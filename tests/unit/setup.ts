import '@testing-library/jest-dom/vitest';

// Setup commun aux tests unitaires.
// Les tests DOM (`*.dom.test.tsx`) s'executent sous jsdom : on y fournit les
// APIs absentes de jsdom mais utilisees par l'interface.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}
