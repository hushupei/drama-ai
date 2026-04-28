// E2E test constants — shared across all test files
// Register a fresh user per test run via beforeEach; avoid hardcoded credentials

export const TEST_USER = {
  username: 'testuser',
  password: 'test123',
  email: 'testuser@example.com',
}

export const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123',
}

export const ROUTES = {
  login: '/login',
  register: '/register',
  novels: '/novels',
  projects: '/projects',
}
