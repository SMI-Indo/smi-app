"use client";

import { useState } from "react";

export interface AdminUser {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  role: string;
  isApproved: boolean;
  memberId: string | null;
  parish: string | null;
  rank: string | null;
  coins: number;
  violationPoints: number;
  createdAt: string;
}

export function AdminMembersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualIdInput, setManualIdInput] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.memberId && u.memberId.toLowerCase().includes(q))
    );
  });

  const handleToggleApprove = async (user: AdminUser) => {
    setLoadingAction(user.id);
    setMessage(null);

    const newApproval = !user.isApproved;

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isApproved: newApproval,
          memberId: user.memberId || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isApproved: newApproval } : u))
        );
        setMessage({
          type: "success",
          text: `Akun ${user.name || user.email} berhasil ${newApproval ? "di-ACC (Aktif)" : "dinonaktifkan"}.`,
        });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal mengubah status ACC." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveManualId = async (user: AdminUser) => {
    if (!manualIdInput.trim()) {
      setMessage({ type: "error", text: "ID Unik tidak boleh kosong." });
      return;
    }

    setLoadingAction(`save-id-${user.id}`);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isApproved: true, // Otomatis ACC jika admin memberikan ID Unik
          memberId: manualIdInput.trim().toUpperCase(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, memberId: manualIdInput.trim().toUpperCase(), isApproved: true }
              : u
          )
        );
        setEditingId(null);
        setManualIdInput("");
        setMessage({
          type: "success",
          text: `ID Unik berhasil diset menjadi "${manualIdInput.trim().toUpperCase()}" dan akun otomatis di-ACC.`,
        });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan ID Unik." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  const pendingCount = users.filter((u) => !u.isApproved && u.role !== "ADMIN").length;
  const approvedCount = users.filter((u) => u.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-primary text-2xl md:text-3xl font-bold">
            Kelola Anggota &amp; ACC Akun
          </h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Hanya akun yang telah di-ACC dan memiliki ID Unik yang dapat mengakses platform Sahabat Misdinar Indonesia.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-label-lg">
            <span>Menunggu ACC: </span>
            <strong className="text-sm font-black">{pendingCount}</strong>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-xs font-label-lg">
            <span>Sudah Di-ACC: </span>
            <strong className="text-sm font-black">{approvedCount}</strong>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-body-md flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-error-container border-error/20 text-error"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau ID unik..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-surface-container-lowest text-on-surface text-sm font-body-md focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Members Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant font-label-sm uppercase">
              <tr>
                <th className="py-3.5 px-4">Nama / Anggota</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">ID Unik Manual</th>
                <th className="py-3.5 px-4">Status ACC</th>
                <th className="py-3.5 px-4">Poin Penalti</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body-md">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface flex items-center gap-2">
                        <span>{user.name || "Nama Belum Diisi"}</span>
                        {user.role === "ADMIN" && (
                          <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-black">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {user.rank || "Mula"} &bull; {user.parish || "Paroki -"}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-on-surface text-xs font-mono">
                      {user.email}
                    </td>

                    {/* Manual Unique Member ID Assignment */}
                    <td className="py-3.5 px-4">
                      {editingId === user.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={manualIdInput}
                            onChange={(e) => setManualIdInput(e.target.value)}
                            placeholder="e.g. SMI-ONLINE-001"
                            className="w-36 px-2.5 py-1 text-xs border border-primary rounded-lg uppercase font-mono bg-surface text-on-surface focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveManualId(user)}
                            disabled={loadingAction === `save-id-${user.id}`}
                            className="p-1 rounded bg-primary text-white hover:bg-primary-container text-xs cursor-pointer"
                            title="Simpan ID"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setManualIdInput("");
                            }}
                            className="p-1 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs cursor-pointer"
                            title="Batal"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            {user.memberId || (
                              <span className="text-on-surface-variant/60 italic font-normal">
                                Belum ada ID
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(user.id);
                              setManualIdInput(user.memberId || "");
                            }}
                            className="text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center"
                            title="Input / Ubah ID Unik Manual"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status ACC */}
                    <td className="py-3.5 px-4">
                      {user.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          <span>Sudah di-ACC</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>Menunggu ACC</span>
                        </span>
                      )}
                    </td>

                    {/* Violation Points */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          user.violationPoints > 10
                            ? "bg-red-100 text-red-700"
                            : user.violationPoints > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {user.violationPoints} Poin
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {user.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleApprove(user)}
                          disabled={loadingAction === user.id}
                          className={`px-3 py-1.5 rounded-full text-xs font-label-sm font-bold transition-all active:scale-95 cursor-pointer ${
                            user.isApproved
                              ? "border border-error/30 text-error hover:bg-error-container/20"
                              : "bg-primary text-white hover:bg-primary-container"
                          }`}
                        >
                          {loadingAction === user.id
                            ? "Memproses..."
                            : user.isApproved
                            ? "Batalkan ACC"
                            : "ACC Akun"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    Tidak ada anggota yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
