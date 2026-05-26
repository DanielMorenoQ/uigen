// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockCookieSet }),
}));

const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  mockCookieSet.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

test("sets the auth-token cookie", async () => {
  await createSession("user-123", "user@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [cookieName] = mockCookieSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("cookie token is a valid JWT containing userId and email", async () => {
  await createSession("user-123", "user@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("user@example.com");
});

test("cookie expires 7 days from now", async () => {
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  const expectedExpiry = new Date("2024-01-08T00:00:00.000Z");
  expect(options.expires).toEqual(expectedExpiry);
});

test("cookie is httpOnly", async () => {
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("cookie is not secure in development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
  vi.unstubAllEnvs();
});

test("cookie is secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(true);
  vi.unstubAllEnvs();
});

test("cookie sameSite is lax", async () => {
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.sameSite).toBe("lax");
});

test("cookie path is /", async () => {
  await createSession("user-123", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.path).toBe("/");
});
