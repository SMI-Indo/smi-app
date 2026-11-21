"use client";

import { apiErrorMessage, readApiBody } from "@/lib/apiErrorMessage";
import { newPassword as newPasswordInput, newPasswordByteLimit } from "@/lib/accountInput";

import { useState } from "react";
import { canAccessMemberFeatures, memberAccessStatus } from "@/lib/memberAccess";

const accessLabels = {
  ADMIN: "Pengurus",
  ACTIVE: "Aktif",
  NOT_APPROVED: "Belum disetujui",
  MISSING_ID: "Nomor anggota belum diisi",
};

export interface MemberData {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  phone: string | null;
  role: "MEMBER" | "ADMIN";
  isApproved: boolean;
  memberId: string | null;
  parish: string | null;
  rank: string | null;
  coins: number;
  violationPoints: number;
  createdAt: string;
}

interface AdminMembersManagerProps {
  initialMembers: MemberData[];
}

export function AdminMembersManager({ initialMembers }: AdminMembersManagerProps) {
  const [members, setMembers] = useState<MemberData[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "APPROVED" | "ADMIN">("ALL");

  // Modal 1: Create New Member Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    password: "",
    parish: "",
    rank: "Mula",
    role: "MEMBER" as "MEMBER" | "ADMIN",
    coins: 50,
    memberId: "",
    isApproved: true,
  });

  // Modal 2: Edit Member Modal
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    parish: "",
    rank: "Mula",
    role: "MEMBER" as "MEMBER" | "ADMIN",
    coins: 0,
    violationPoints: 0,
    memberId: "",
    isApproved: false,
  });

  // Modal 3: Reset Password Modal
  const [resetPwMember, setResetPwMember] = useState<MemberData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Modal 4: Add Violation Modal
  const [violationMember, setViolationMember] = useState<MemberData | null>(null);
  const [violationPoints, setViolationPoints] = useState<number>(5);
  const [violationDate, setViolationDate] = useState("");
  const [violationFollowUp, setViolationFollowUp] = useState("");
  const [violationSeverity, setViolationSeverity] = useState("RINGAN");
  const [violationReason, setViolationReason] = useState("");

  // Modal 5: Delete Confirmation Modal
  const [deletingMember, setDeletingMember] = useState<MemberData | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter logic
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      (m.memberId && m.memberId.toLowerCase().includes(q)) ||
      (m.parish && m.parish.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterTab === "PENDING") return !canAccessMemberFeatures(m);
    if (filterTab === "APPROVED") return memberAccessStatus(m) === "ACTIVE";
    if (filterTab === "ADMIN") return m.role === "ADMIN";
    return true;
  });

  // Format WhatsApp number link
  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    if (!clean.startsWith("62")) clean = "62" + clean;
    return `https://wa.me/${clean}`;
  };

  // Toggle ACC
  const handleToggleApprove = async (member: MemberData) => {
    setLoadingAction(`approve-${member.id}`);
    setMessage(null);

    const newApproval = !member.isApproved;

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: member.id,
          isApproved: newApproval,
          memberId: member.memberId || undefined,
        }),
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, ...data.user } : m))
        );
        setMessage({
          type: "success",
          text: `Persetujuan ${member.name || member.email} berhasil ${newApproval ? "diberikan" : "dicabut"}.`,
        });
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal mengubah status ACC.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Create Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = newPasswordInput.safeParse(createForm.password);
    if (!password.success) {
      setMessage({ type: "error", text: password.error.issues[0].message });
      return;
    }
    setLoadingAction("create-member");
    setMessage(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          ...createForm,
        }),
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMembers((prev) => [data.user, ...prev]);
        setMessage({
          type: "success",
          text: `Akun ${data.user.name} berhasil ditambahkan. ${accessLabels[memberAccessStatus(data.user)]}.`,
        });
        setIsCreateOpen(false);
        setCreateForm({
          name: "",
          nickname: "",
          email: "",
          phone: "",
          password: "",
          parish: "",
          rank: "Mula",
          role: "MEMBER",
          coins: 50,
          memberId: "",
          isApproved: true,
        });
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal menambahkan anggota baru.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: MemberData) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || "",
      nickname: member.nickname || "",
      email: member.email || "",
      phone: member.phone || "",
      parish: member.parish || "",
      rank: member.rank || "Mula",
      role: member.role || "MEMBER",
      coins: member.coins || 0,
      violationPoints: member.violationPoints || 0,
      memberId: member.memberId || "",
      isApproved: member.isApproved,
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setLoadingAction("save-edit");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...data.user } : m))
        );
        setMessage({
          type: "success",
          text: `Data anggota ${editForm.name || editForm.email} berhasil diperbarui.`,
        });
        setEditingMember(null);
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal memperbarui data anggota.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwMember) return;

    const password = newPasswordInput.safeParse(newPassword);
    if (!password.success) {
      setMessage({ type: "error", text: password.error.issues[0].message });
      return;
    }

    setLoadingAction("save-pw");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/members/${resetPwMember.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Kata sandi anggota ${resetPwMember.name || resetPwMember.email} berhasil diganti.`,
        });
        setResetPwMember(null);
        setNewPassword("");
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal mereset kata sandi.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Add Violation
  const handleAddViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationMember) return;

    if (!violationReason.trim()) {
      setMessage({ type: "error", text: "Alasan pelanggaran wajib diisi." });
      return;
    }

    setLoadingAction("save-violation");
    setMessage(null);

    try {
      const res = await fetch("/api/admin/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: violationMember.id,
          points: violationPoints,
          reason: violationReason.trim(),
          date: violationDate,
          followUp: violationFollowUp.trim(),
          severity: violationSeverity,
        }),
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === violationMember.id
              ? { ...m, violationPoints: data.violation.user.violationPoints }
              : m
          )
        );
        setMessage({
          type: "success",
          text: `Pelanggaran (+${violationPoints} poin) dicatat untuk ${violationMember.name || violationMember.email}.`,
        });
        setViolationMember(null);
        setViolationReason("");
        setViolationPoints(5);
        setViolationDate("");
        setViolationFollowUp("");
        setViolationSeverity("RINGAN");
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal mencatat pelanggaran.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Delete Member
  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    setLoadingAction("delete-member");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/members/${deletingMember.id}`, {
        method: "DELETE",
      });

      const data = await readApiBody(res);
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
        setMessage({
          type: "success",
          text: `Akun anggota ${deletingMember.name || deletingMember.email} berhasil dihapus.`,
        });
        setDeletingMember(null);
      } else {
        setMessage({ type: "error", text: apiErrorMessage(data, "Gagal menghapus anggota.") });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-primary text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
              group
            </span>
            Manajemen Anggota &amp; Membership
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mt-1">
            Input anggota manual, kelola nomor membership resmi, kontak WhatsApp/HP, poin pelanggaran, dan hak akses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs bg-surface-container-high border border-outline-variant/60 text-on-surface-variant px-3 py-1.5 rounded-full font-bold">
            Total: {members.length} Anggota
          </span>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white font-label-lg text-xs font-semibold hover:bg-primary-container shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-body-md flex items-center justify-between transition-all ${
            message.type === "success"
              ? "bg-secondary-container/20 text-on-surface border border-secondary-container"
              : "bg-error-container text-error border border-error/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama, email, nomor HP/WA, ID membership, atau paroki..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "ALL", label: "Semua" },
                { id: "APPROVED", label: "Aktif (ACC)" },
                { id: "PENDING", label: "Akses belum aktif" },
                { id: "ADMIN", label: "Pengurus" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-label-lg transition-all ${
                  filterTab === tab.id
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">
              person_search
            </span>
            <p className="font-headline-md text-on-surface font-bold text-sm">
              Tidak ada data anggota yang cocok
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Gunakan tombol &quot;Tambah Anggota Baru&quot; di atas untuk mendaftarkan anggota baru secara manual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-label-lg uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 pl-4 sm:pl-6">Profil &amp; Kontak</th>
                  <th className="py-3.5 px-3">No. HP / WA</th>
                  <th className="py-3.5 px-3">Paroki &amp; Pangkat</th>
                  <th className="py-3.5 px-3">Membership ID</th>
                  <th className="py-3.5 px-3">Pelanggaran</th>
                  <th className="py-3.5 px-3">Status ACC</th>
                  <th className="py-3.5 pr-4 sm:pr-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filtered.map((member) => {
                  const waLink = getWhatsAppLink(member.phone);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      {/* Profil */}
                      <td className="py-3 pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-on-surface text-sm truncate">
                                {member.name || "Tanpa Nama"}
                              </span>
                              {member.role === "ADMIN" && (
                                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-on-surface-variant/70 text-xs block truncate">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* No HP / WhatsApp */}
                      <td className="py-3 px-3">
                        {member.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-on-surface font-semibold">
                              {member.phone}
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/40 italic text-[11px]">
                            -
                          </span>
                        )}
                      </td>

                      {/* Paroki & Pangkat */}
                      <td className="py-3 px-3">
                        <div className="text-on-surface font-medium truncate max-w-[140px]">
                          {member.parish || "-"}
                        </div>
                        <span className="text-[11px] text-secondary font-semibold">
                          {member.rank || "Mula"}
                        </span>
                      </td>

                      {/* ID Membership */}
                      <td className="py-3 px-3">
                        {member.memberId ? (
                          <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/20 block w-fit">
                            {member.memberId}
                          </span>
                        ) : (
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Belum Ada ID
                          </span>
                        )}
                      </td>

                      {/* Pelanggaran */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                              member.violationPoints > 0
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-surface-container text-on-surface-variant/70"
                            }`}
                          >
                            {member.violationPoints} pt
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setViolationMember(member);
                              setViolationReason("");
                              setViolationPoints(5);
                            }}
                            title="Tambah Catatan Pelanggaran"
                            className="p-1 rounded text-on-surface-variant/60 hover:text-error hover:bg-error-container/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add_alert</span>
                          </button>
                        </div>
                      </td>

                      {/* Status ACC */}
                      <td className="py-3 px-3">
                        {member.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label-lg font-bold bg-surface-container text-on-surface">
                            <span aria-hidden="true" className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            {accessLabels.ADMIN}
                          </span>
                        ) : <button
                          type="button"
                          onClick={() => handleToggleApprove(member)}
                          disabled={loadingAction === `approve-${member.id}`}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label-lg font-bold transition-all shadow-sm ${
                            canAccessMemberFeatures(member)
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200 animate-pulse"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {canAccessMemberFeatures(member) ? "verified" : "hourglass_top"}
                          </span>
                          <span>{accessLabels[memberAccessStatus(member)]}</span>
                        </button>}
                      </td>

                      {/* Tindakan */}
                      <td className="py-3 pr-4 sm:pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            title="Edit Data Lengkap"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetPwMember(member);
                              setNewPassword("");
                            }}
                            title="Reset Password Anggota"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-secondary transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">lock_reset</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingMember(member)}
                            title="Hapus Anggota"
                            className="p-1.5 rounded-lg text-error/70 hover:bg-error-container/40 hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Tambah Anggota Baru Manual */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                <h2 className="font-headline-md text-primary font-bold text-base sm:text-lg">
                  Tambah Anggota Baru (Manual)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-on-surface-variant leading-relaxed">
                💡 <span className="font-bold text-primary">Aturan Membership:</span> Hanya anggota dengan <strong>Nomor Membership ID</strong> terisi dan status <strong>Aktif (ACC)</strong> yang dapat melakukan login ke website.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nama anggota..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={createForm.nickname}
                    onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
                    placeholder="Nama akrab..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Email Akun *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="anggota@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="misal: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Nomor Membership ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.memberId}
                    onChange={(e) => setCreateForm({ ...createForm, memberId: e.target.value })}
                    placeholder="misal: SMI-2026-0005"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono uppercase font-bold focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Kata Sandi Awal *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimal 8 karakter, maksimal 72 byte" minLength={8} maxLength={newPasswordByteLimit}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Asal Paroki
                  </label>
                  <input
                    type="text"
                    value={createForm.parish}
                    onChange={(e) => setCreateForm({ ...createForm, parish: e.target.value })}
                    placeholder="Paroki Asal..."
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Pangkat Misdinar
                  </label>
                  <select
                    value={createForm.rank}
                    onChange={(e) => setCreateForm({ ...createForm, rank: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Mula">Mula</option>
                    <option value="Madya">Madya</option>
                    <option value="Utama">Utama</option>
                    <option value="Pembina">Pembina</option>
                    <option value="Pengurus">Pengurus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value as "MEMBER" | "ADMIN" })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-bold focus:border-primary focus:outline-none"
                  >
                    <option value="MEMBER">MEMBER (Anggota Biasa)</option>
                    <option value="ADMIN">ADMIN (Pengurus Portal)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Bonus Koin Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.coins}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, coins: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "create-member"}
                  className="px-6 py-2 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "create-member" ? "Menambahkan..." : "Tambah Anggota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Member Profile */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
                <h2 className="font-headline-md text-primary font-bold text-base sm:text-lg">
                  Edit Profil &amp; Data Anggota
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="misal: 081234567890"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Asal Paroki
                  </label>
                  <input
                    type="text"
                    value={editForm.parish}
                    onChange={(e) => setEditForm({ ...editForm, parish: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Pangkat Misdinar
                  </label>
                  <select
                    value={editForm.rank}
                    onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Mula">Mula</option>
                    <option value="Madya">Madya</option>
                    <option value="Utama">Utama</option>
                    <option value="Pembina">Pembina</option>
                    <option value="Pengurus">Pengurus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Membership ID
                  </label>
                  <input
                    type="text"
                    value={editForm.memberId}
                    onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                    placeholder="SMI-2026-001"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-mono uppercase font-bold focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Jumlah Koin
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.coins}
                    onChange={(e) => setEditForm({ ...editForm, coins: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Poin Pelanggaran
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.violationPoints}
                    readOnly
                    aria-label="Total poin dari catatan pelanggaran"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-mono text-error font-bold focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as "MEMBER" | "ADMIN" })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-bold focus:border-primary focus:outline-none"
                  >
                    <option value="MEMBER">MEMBER (Anggota Biasa)</option>
                    <option value="ADMIN">ADMIN (Pengurus Portal)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Status Verifikasi ACC
                  </label>
                  <select
                    value={editForm.isApproved ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.value === "true" })}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-bold focus:border-primary focus:outline-none"
                  >
                    <option value="true">Aktif (Sudah di-ACC)</option>
                    <option value="false">Belum disetujui</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-edit"}
                  className="px-6 py-2 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-edit" ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password */}
      {resetPwMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">lock_reset</span>
                <h2 className="font-headline-md text-primary font-bold text-base">
                  Reset Password Anggota
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setResetPwMember(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Atur password baru untuk akun{" "}
                <span className="font-bold text-on-surface">
                  {resetPwMember.name || resetPwMember.email}
                </span>
                . Anggota dapat langsung masuk menggunakan password ini.
              </p>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Kata sandi baru (minimal 8 karakter, maksimal 72 byte)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={newPasswordByteLimit}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm pr-10 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setResetPwMember(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-pw"}
                  className="px-6 py-2 rounded-full bg-secondary text-white text-xs font-label-lg font-bold hover:bg-secondary/90 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-pw" ? "Menyimpan..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Tambah Catatan Pelanggaran */}
      {violationMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-amber-300 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2 text-amber-900">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="font-headline-md font-bold text-base">Catat Pelanggaran</h2>
              </div>
              <button
                type="button"
                onClick={() => setViolationMember(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddViolation} className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant">
                Catat penambahan poin kedisiplinan untuk anggota{" "}
                <span className="font-bold text-on-surface">
                  {violationMember.name || violationMember.email}
                </span>{" "}
                (Saat ini: {violationMember.violationPoints} poin).
              </p>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Poin Pelanggaran (+Poin)
                </label>
                <select
                  value={violationPoints}
                  onChange={(e) => setViolationPoints(parseInt(e.target.value) || 5)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-bold font-mono focus:border-primary focus:outline-none"
                >
                  <option value={5}>+5 Poin (Terlambat / Ketidakhadiran)</option>
                  <option value={10}>+10 Poin (Absen Tanpa Keterangan)</option>
                  <option value={15}>+15 Poin (Indisipliner Serius)</option>
                  <option value={20}>+20 Poin (Pelanggaran Berat)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Alasan / Keterangan Pelanggaran *
                </label>
                <textarea
                  required
                  rows={3}
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  placeholder="misal: Tidak hadir pada pertemuan bulanan online tanpa konfirmasi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="smi-form space-y-3">
                <label>Tanggal kejadian<input type="date" required value={violationDate} onChange={(event) => setViolationDate(event.target.value)} /></label>
                <label>Tingkat keparahan<select value={violationSeverity} onChange={(event) => setViolationSeverity(event.target.value)}>
                  <option value="RINGAN">Ringan</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="BERAT">Berat</option>
                </select></label>
                <label>Tindak lanjut<textarea required minLength={3} maxLength={2000} value={violationFollowUp} onChange={(event) => setViolationFollowUp(event.target.value)} /></label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setViolationMember(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-violation"}
                  className="px-6 py-2 rounded-full bg-amber-700 text-white text-xs font-label-lg font-bold hover:bg-amber-800 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-violation" ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Confirmation */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-error/20 flex items-center justify-between bg-error-container/20">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="font-headline-md font-bold text-base">Hapus Anggota</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus akun anggota{" "}
                <span className="font-bold text-on-surface">
                  {deletingMember.name || deletingMember.email}
                </span>{" "}
                secara permanen?
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setDeletingMember(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMember}
                  disabled={loadingAction === "delete-member"}
                  className="px-6 py-2 rounded-full bg-error text-white text-xs font-label-lg font-bold hover:bg-error/90 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "delete-member" ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
