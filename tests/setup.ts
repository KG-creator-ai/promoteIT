import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// testing-library auto-cleanup only self-registers with global afterEach;
// with globals:false we wire it explicitly so renders never leak across tests.
afterEach(() => {
  cleanup();
});
