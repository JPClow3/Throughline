// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decryptJson,
  deriveKeys,
  encryptJson,
  generateDek,
  importDek,
  randomSalt,
  unwrapDek,
  wrapDek
} from "./crypto";

describe("auth crypto", () => {
  it("derives a stable authKey for the same password + salt", async () => {
    const salt = randomSalt();
    const a = await deriveKeys("correct horse battery", salt);
    const b = await deriveKeys("correct horse battery", salt);
    expect(a.authKey).toBe(b.authKey);

    const other = await deriveKeys("correct horse battery", randomSalt());
    expect(other.authKey).not.toBe(a.authKey);

    const wrongPw = await deriveKeys("different password", salt);
    expect(wrongPw.authKey).not.toBe(a.authKey);
  });

  it("wraps and unwraps the DEK, and encrypts/decrypts records", async () => {
    const salt = randomSalt();
    const { kek } = await deriveKeys("hunter2-hunter2", salt);
    const dek = generateDek();
    const wrapped = await wrapDek(dek, kek);

    const unwrapped = await unwrapDek(wrapped, kek);
    expect(Buffer.from(unwrapped)).toEqual(Buffer.from(dek));

    const dekKey = await importDek(unwrapped);
    const record = { id: "task_1", title: "Wire up the landing page", tags: ["focus"] };
    const { ciphertext, iv } = await encryptJson(record, dekKey);
    expect(ciphertext).not.toContain("landing");

    const decrypted = await decryptJson<typeof record>(ciphertext, iv, dekKey);
    expect(decrypted).toEqual(record);
  });

  it("cannot unwrap the DEK with keys from a different password", async () => {
    const salt = randomSalt();
    const { kek } = await deriveKeys("right-password", salt);
    const dek = generateDek();
    const wrapped = await wrapDek(dek, kek);

    const { kek: wrongKek } = await deriveKeys("wrong-password", salt);
    await expect(unwrapDek(wrapped, wrongKek)).rejects.toBeDefined();
  });
});
