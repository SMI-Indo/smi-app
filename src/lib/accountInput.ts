import { z } from "zod";

const utf8 = new TextEncoder();
export const newPasswordByteLimit = 72;
export const existingPasswordByteLimit = 4096;

export const accountEmail = z.string().trim().toLowerCase().max(254).email("Format email tidak valid");
export const recordId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "ID tidak valid.");
export const memberNumber = z.string().trim().toUpperCase().max(128);
export const memberName = z.string().trim().min(1, "Nama lengkap wajib diisi").max(160);
export const optionalProfileText = z.string().trim().max(160).nullable().optional();

export const existingPassword = z.string().min(1, "Kata sandi wajib diisi")
  .max(existingPasswordByteLimit, "Kata sandi terlalu panjang")
  .refine((value) => utf8.encode(value).length <= existingPasswordByteLimit, "Kata sandi terlalu panjang");

export const newPassword = z.string().min(8, "Kata sandi minimal 8 karakter")
  .max(newPasswordByteLimit, "Kata sandi maksimal 72 byte")
  .refine((value) => value.trim().length > 0 && utf8.encode(value).length <= newPasswordByteLimit,
    "Kata sandi wajib diisi dan tidak boleh melebihi 72 byte");

export const credentialsInput = z.object({ email: accountEmail, password: existingPassword });
export type CredentialsInput = z.infer<typeof credentialsInput>;
