import { PasswordEntry } from '../types';

export interface QrPayload {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

export async function encryptEntryPayload(entry: Partial<PasswordEntry>, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const cleanData = JSON.stringify({
    title: entry.title || '',
    username: entry.username || '',
    password: entry.password || '',
    url: entry.url || '',
    notes: entry.notes || '',
    category: entry.category || 'General',
  });

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(cleanData)
  );

  const payload: QrPayload = {
    version: 1,
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
  };

  return JSON.stringify(payload);
}

export async function decryptEntryPayload(cipherText: string, pin: string): Promise<Partial<PasswordEntry>> {
  const payload: QrPayload = JSON.parse(cipherText);
  if (payload.version !== 1) {
    throw new Error('Phiên bản payload QR không được hỗ trợ');
  }

  const salt = Uint8Array.from(atob(payload.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBytes
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}

