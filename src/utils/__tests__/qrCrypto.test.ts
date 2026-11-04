import { describe, it, expect } from 'vitest';
import { encryptEntryPayload, decryptEntryPayload } from '../qrCrypto';

describe('QR Crypto utilities', () => {
  const sampleEntry = {
    title: 'GitHub',
    username: 'developer',
    password: 'superSecretPassword123!',
    url: 'https://github.com',
    notes: 'Personal account',
    category: 'Work',
  };

  it('successfully encrypts and decrypts with correct PIN', async () => {
    const pin = '1234';
    const cipherText = await encryptEntryPayload(sampleEntry, pin);
    expect(cipherText).toContain('"version":1');

    const decrypted = await decryptEntryPayload(cipherText, pin);
    expect(decrypted.title).toBe(sampleEntry.title);
    expect(decrypted.username).toBe(sampleEntry.username);
    expect(decrypted.password).toBe(sampleEntry.password);
    expect(decrypted.url).toBe(sampleEntry.url);
    expect(decrypted.notes).toBe(sampleEntry.notes);
    expect(decrypted.category).toBe(sampleEntry.category);
  });

  it('fails decryption with wrong PIN', async () => {
    const cipherText = await encryptEntryPayload(sampleEntry, '9999');
    await expect(decryptEntryPayload(cipherText, '0000')).rejects.toThrow();
  });
});
