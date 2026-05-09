/**
 * @purpose Vitest global setup: registers jest-dom matchers and mocks idb-keyval to prevent real IndexedDB writes during tests.
 * @why DOM matchers must be registered once globally; idb-keyval mock prevents test pollution and CI failures.
 * @role config
 * @exports -
 * @uses @testing-library/jest-dom
 * @stability stable
 * @gotchas Bare vi.mock relies on Vitest hoisting; must be referenced in vitest.config setupFiles or mocks won't apply
 */
import '@testing-library/jest-dom'

// Mock idb-keyval since we are in a node environment for testing
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([]),
}))