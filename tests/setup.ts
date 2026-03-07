import '@testing-library/jest-dom/vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.TENANT_MODE = 'path';
process.env.NODE_ENV = 'test';
