import crypto from 'node:crypto';

function buildDataCheckString(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    return null;
  }

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  return { hash, dataCheckString, params };
}

export function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) {
    return null;
  }

  const parsed = buildDataCheckString(initData);

  if (!parsed) {
    return null;
  }

  const { hash, dataCheckString, params } = parsed;
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const incomingHash = Buffer.from(hash, 'hex');
  const expectedHash = Buffer.from(calculatedHash, 'hex');

  if (incomingHash.length !== expectedHash.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(incomingHash, expectedHash)) {
    return null;
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    return null;
  }

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}
