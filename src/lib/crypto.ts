import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Gmail tokens are encrypted at rest with AES-256-GCM. The key comes from ENCRYPTION_KEY if set,
// otherwise from GOOGLE_CLIENT_SECRET, so a copy of the database alone can't be used to read mail.
function key() {
  const secret = process.env.ENCRYPTION_KEY || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("Set GOOGLE_CLIENT_SECRET (or ENCRYPTION_KEY) to store Gmail tokens");
  return createHash("sha256").update(`outreach-tokens:${secret}`).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decrypt(payload: string) {
  const [v, iv, tag, data] = payload.split(".");
  if (v !== "v1") throw new Error("Unknown token format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
