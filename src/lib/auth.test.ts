import { describe, it, expect, vi, beforeEach } from "vitest";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

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

    // Access the raw custom authorize callback from options
    const authorize = credentialsProvider.options.authorize as Function;

    await expect(authorize({ email: "", password: "password123" }, {} as any)).rejects.toThrow(
      "Email dan password wajib diisi"
    );

    await expect(authorize({ email: "test@smi.org", password: "" }, {} as any)).rejects.toThrow(
      "Email dan password wajib diisi"
    );
  });

  it("should throw error if user is not found in database", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as Function;

    // Simulate user not found in database
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    await expect(
      authorize({ email: "unknown@smi.org", password: "password123" }, {} as any)
    ).rejects.toThrow("Email atau password salah");
  });

  it("should throw error if password verification fails", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as Function;

    const mockUser = {
      id: "user-1",
      email: "test@smi.org",
      password: "hashed_password_abc",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    mockCompare.mockResolvedValue(false); // password mismatch

    await expect(
      authorize({ email: "test@smi.org", password: "wrongpassword" }, {} as any)
    ).rejects.toThrow("Email atau password salah");
  });

  it("should return user object if credentials and password match", async () => {
    if (!credentialsProvider || !("options" in credentialsProvider)) {
      throw new Error("Credentials provider options not found");
    }

    const authorize = credentialsProvider.options.authorize as Function;

    const mockUser = {
      id: "user-1",
      name: "Stefanus Mario",
      email: "test@smi.org",
      password: "hashed_password_abc",
      role: "MEMBER",
      image: "avatar.jpg",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    mockCompare.mockResolvedValue(true); // password matches

    const result = await authorize({
      email: "test@smi.org",
      password: "correctpassword",
    }, {} as any);

    expect(result).not.toBeNull();
    expect(result.id).toBe("user-1");
    expect(result.name).toBe("Stefanus Mario");
    expect(result.email).toBe("test@smi.org");
    expect(result.role).toBe("MEMBER");
  });
});
