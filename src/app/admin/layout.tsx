import { checkAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await checkAdminSession();

  if (!auth) {
    redirect("/");
  }

  const adminUser = {
    name: auth.user.name,
    email: auth.user.email,
    role: auth.user.role,
  };

  return <AdminLayoutClient adminUser={adminUser}>{children}</AdminLayoutClient>;
}
