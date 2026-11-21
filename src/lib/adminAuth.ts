import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/apiErrors";

async function getAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { status: 401 } as const;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) return { status: 401 } as const;
  if (user.role !== "ADMIN") return { status: 403 } as const;
  return { status: 200, auth: { user, session } } as const;
}

export async function checkAdminSession() {
  const access = await getAdminAccess();
  return access.status === 200 ? access.auth : null;
}

export async function authorizeAdminApi() {
  try {
    const access = await getAdminAccess();
    if (access.status === 200) return { auth: access.auth };
    if (access.status === 401) return { error: apiError(401, "Masuk kembali untuk melanjutkan.") };
    return { error: apiError(403, "Akses khusus pengurus.") };
  } catch {
    return { error: apiError(500, "Akses belum dapat diperiksa. Coba lagi.") };
  }
}
