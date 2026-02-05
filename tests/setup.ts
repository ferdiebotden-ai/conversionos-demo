/**
 * Test Setup
 * Shared configuration for Vitest unit tests
 */

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend expect with Testing Library matchers
// @testing-library/jest-dom provides matchers like toBeInTheDocument()
