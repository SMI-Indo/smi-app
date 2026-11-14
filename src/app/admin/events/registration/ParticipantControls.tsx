"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteParticipant, emailParticipant, type ParticipantEmailResult } from "./participantActions";

type Props = { eventId: string; id: string; name: string; email: string };

export function ParticipantControls({ eventId, id, name, email }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, startDelete] = useTransition();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [result, send, sending] = useActionState<ParticipantEmailResult, FormData>(async (previous, form) => {
    try {
      const response = await emailParticipant(eventId, id, previous, form);
      if (response.sent) {
        setSubject("");
        setMessage("");
      }
      return response;
    } catch {
      return { error: "Status pengiriman tidak dapat diperiksa. Cek layanan email sebelum mengirim ulang." };
    }
  }, {});

  return (
    <div className="min-w-0 border-t border-outline-variant pt-2 text-sm sm:col-span-2">
      <details>
        <summary className="w-fit min-h-11 cursor-pointer py-3 font-semibold text-primary hover:underline">
          Tulis email
        </summary>
        <form action={send} className="smi-form registration-form max-w-xl space-y-3 pb-4">
          <p className="text-on-surface-variant">Kepada {email}</p>
          <label>Subjek<input name="subject" required maxLength={150} value={subject} readOnly={sending}
            onChange={(event) => setSubject(event.target.value)} /></label>
          <label>Pesan<textarea name="message" rows={4} required maxLength={4000} value={message} readOnly={sending}
            onChange={(event) => setMessage(event.target.value)} /></label>
          {!sending && result.error && <p role="alert" className="text-error">{result.error}</p>}
          {!sending && result.sent && <p role="status">Email dikirim ke {email}.</p>}
          <button className="registration-submit" disabled={sending || deleting}>
            {sending ? "Mengirim…" : "Kirim email"}
          </button>
        </form>
      </details>
      {confirming ? (
        <div className="space-y-2 rounded-lg border border-error/30 p-3">
          <p>Hapus pendaftaran <strong>{name}</strong> untuk kegiatan ini? Data pendaftaran akan dihapus permanen.</p>
          {deleteError && <p role="alert" className="text-error">{deleteError}</p>}
          <div className="flex flex-wrap gap-x-4">
            <button type="button" className="min-h-11 cursor-pointer rounded-lg border border-error px-3 font-semibold text-error hover:bg-error-container disabled:cursor-wait disabled:opacity-60"
              disabled={deleting || sending} onClick={() => startDelete(async () => {
                setDeleteError("");
                try {
                  const result = await deleteParticipant(eventId, id);
                  if (result.error) setDeleteError(result.error);
                } catch {
                  setDeleteError("Status penghapusan tidak dapat diperiksa. Muat ulang rekap peserta.");
                }
              })}>
              {deleting ? "Menghapus…" : "Ya, hapus peserta"}
            </button>
            <button type="button" className="min-h-11 cursor-pointer px-2 hover:underline disabled:opacity-60" disabled={deleting}
              onClick={() => { setConfirming(false); setDeleteError(""); }}>Batal</button>
          </div>
        </div>
      ) : (
        <button type="button" className="min-h-11 cursor-pointer font-semibold text-error hover:underline" onClick={() => setConfirming(true)}>
          Hapus peserta
        </button>
      )}
    </div>
  );
}
