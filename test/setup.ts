import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  writable: true,
  configurable: true,
  value: vi.fn(() => false),
});

Object.defineProperty(Element.prototype, 'setPointerCapture', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(() => 'blob:test-preview-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});
