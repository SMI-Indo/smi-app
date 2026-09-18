import { describe, it, expect, vi, beforeEach } from "vitest";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { User } from "@prisma/client";

// Mock database
vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Use vi.hoisted to declare mock functions before hoisting
const { mockCompare } = vi.hoisted(() => {
  return {
    mockCompare: vi.fn(),
  };
});

// Mock both default and named export of bcryptjs for compatibility
vi.mock("bcryptjs", () => {
  return {
    compare: mockCompare,
    default: {
      compare: mockCompare,
    },
  };
});

type AuthorizeFn = (
  credentials: Record<string, string> | undefined,
  req: unknown
) => Promise<unknown>;

describe("NextAuth Credentials authorize provider", () => {
  const credentialsProvider = authOptions.providers.find(
    (p) => p.id === "credentials"
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if credentials email or password is missing", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    await expect(authorize({ email: "", password: "password123" }, {})).rejects.toThrow(
      "Email dan password wajib diisi"
    );

    await expect(authorize({ email: "test@smi.org", password: "" }, {})).rejects.toThrow(
      "Email dan password wajib diisi"
    );
  });

  it("should throw error if user is not found in database", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    // Simulate user not found in database
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      authorize({ email: "unknown@smi.org", password: "password123" }, {})
    ).rejects.toThrow("Email atau password salah");
  });

  it("should throw error if password verification fails", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    const mockUser = {
      id: "user-1",
      email: "test@smi.org",
      password: "hashed_password_abc",
    } as unknown as User;

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(false); // password mismatch

    await expect(
      authorize({ email: "test@smi.org", password: "wrongpassword" }, {})
    ).rejects.toThrow("Email atau password salah");
  });

  it("should return user object if credentials and password match", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    const mockUser = {
      id: "user-1",
      name: "Stefanus Mario",
      email: "test@smi.org",
      password: "hashed_password_abc",
      role: "MEMBER",
      image: "avatar.jpg",
      isApproved: false,
    } as unknown as User;

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(true);

    await expect(
      authorize({ email: "test@smi.org", password: "correctpassword" }, {})
    ).rejects.toThrow("Akun Anda belum disetujui (di-ACC) oleh Admin");
  });

  it("should return user object if credentials match and user is approved", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    const mockUser = {
      id: "user-1",
      name: "Stefanus Mario",
      email: "test@smi.org",
      password: "hashed_password_abc",
      role: "MEMBER",
      image: "avatar.jpg",
      isApproved: true,
    } as unknown as User;

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(true); // password matches

    const result = (await authorize({
      email: "test@smi.org",
      password: "correctpassword",
    }, {})) as { id: string; name: string; email: string; role: string };

    expect(result).not.toBeNull();
    expect(result.id).toBe("user-1");
    expect(result.name).toBe("Stefanus Mario");
    expect(result.email).toBe("test@smi.org");
    expect(result.role).toBe("MEMBER");
  });

  it("should allow ADMIN even if isApproved is false", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as AuthorizeFn;

    const mockAdmin = {
      id: "admin-1",
      name: "Pengurus Pusat SMI",
      email: "admin@smi.org",
      password: "hashed_admin_pwd",
      role: "ADMIN",
      image: "admin.jpg",
      isApproved: false,
    } as unknown as User;

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin);
    mockCompare.mockResolvedValue(true);

    const result = (await authorize({
      email: "admin@smi.org",
      password: "correctpassword",
    }, {})) as { id: string; name: string; email: string; role: string };

    expect(result).not.toBeNull();
    expect(result.id).toBe("admin-1");
    expect(result.role).toBe("ADMIN");
  });
});
