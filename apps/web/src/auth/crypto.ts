/**
 * End-to-end encryption primitives (Web Crypto, no dependencies).
 *
 * Model: password + per-user salt --PBKDF2--> 64 bytes, split into a Key
 * Encryption Key (KEK, AES-GCM) and an authKey (sent to the server for login).
 * A random Data Encryption Key (DEK) encrypts record JSON; the DEK is wrapped by
 * the KEK and stored on the server. The server never sees the password or the DEK.
 */

const PBKDF2_ITERATIONS = 210_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromB64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function randomSalt(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

export type DerivedKeys = { kek: CryptoKey; authKey: string };

/** Derive the KEK (for wrapping the DEK) and the authKey (server credential) from a password. */
export async function deriveKeys(password: string, saltB64: string): Promise<DerivedKeys> {
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromB64(saltB64) as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      baseKey,
      512
    )
  );
  const kek = await crypto.subtle.importKey("raw", bits.slice(0, 32) as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt"
  ]);
  return { kek, authKey: toB64(bits.slice(32, 64)) };
}

export function generateDek(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function aesEncrypt(key: CryptoKey, data: Uint8Array): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data as BufferSource);
  return { iv: toB64(iv), ciphertext: toB64(new Uint8Array(cipher)) };
}

async function aesDecrypt(key: CryptoKey, ivB64: string, ciphertextB64: string): Promise<Uint8Array> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) as BufferSource },
    key,
    fromB64(ciphertextB64) as BufferSource
  );
  return new Uint8Array(plain);
}

/** Wrap the DEK with the KEK → server-storable string. */
export async function wrapDek(dek: Uint8Array, kek: CryptoKey): Promise<string> {
  const { iv, ciphertext } = await aesEncrypt(kek, dek);
  return `${iv}:${ciphertext}`;
}

export async function unwrapDek(wrapped: string, kek: CryptoKey): Promise<Uint8Array> {
  const [iv, ciphertext] = wrapped.split(":");
  return aesDecrypt(kek, iv, ciphertext);
}

export function dekToB64(dek: Uint8Array): string {
  return toB64(dek);
}

export function dekFromB64(value: string): Uint8Array {
  return fromB64(value);
}

/** Import raw DEK bytes as an AES-GCM key for record encryption. */
export async function importDek(dek: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", dek as BufferSource, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptJson(value: unknown, dekKey: CryptoKey): Promise<{ iv: string; ciphertext: string }> {
  return aesEncrypt(dekKey, encoder.encode(JSON.stringify(value)));
}

export async function decryptJson<T>(ciphertext: string, iv: string, dekKey: CryptoKey): Promise<T> {
  const bytes = await aesDecrypt(dekKey, iv, ciphertext);
  return JSON.parse(decoder.decode(bytes)) as T;
}
