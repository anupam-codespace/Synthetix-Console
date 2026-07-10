import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'synthetix-super-secret-key-for-development'
);

export async function signJWT(payload: { userId: string; email: string; name?: string | null }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { userId: string; email: string; name?: string | null };
  } catch (error) {
    return null;
  }
}
