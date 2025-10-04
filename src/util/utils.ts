import crypto from 'crypto';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createOrderLinkId(symbol: string): string {
  return `dex-arb-${symbol}-${Date.now()}`;
}

export function decrypt(
  encryptedKey: string,
  salt: string,
  password: string
): string {
  const iterations = 10000;
  const keyLength = 32;
  const saltBuffer = Buffer.from(salt, 'hex');
  const encryptedKeyBuffer = Buffer.from(encryptedKey, 'hex');

  const derivedKey = crypto.pbkdf2Sync(
    password,
    saltBuffer,
    iterations,
    keyLength,
    'sha256'
  );

  // The nonce is prepended to the ciphertext
  const nonce = encryptedKeyBuffer.slice(0, 12);
  // The auth tag is appended to the ciphertext
  const tag = encryptedKeyBuffer.slice(encryptedKeyBuffer.length - 16);
  // The actual encrypted data
  const encrypted = encryptedKeyBuffer.slice(
    12,
    encryptedKeyBuffer.length - 16
  );

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, nonce);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString();
}
