// Shared in-memory store for email verification codes
// In production, replace with Redis or a database
export const verificationCodes = new Map<string, { code: string; expires: number }>();
