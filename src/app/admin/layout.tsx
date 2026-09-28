import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const adminUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  return <AdminLayoutClient adminUser={adminUser}>{children}</AdminLayoutClient>;
}
