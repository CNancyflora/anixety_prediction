import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();
    if (!email || !resetToken || !newPassword) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    const formattedEmail = email.trim().toLowerCase();

    const docRef = adminDb.collection('password_resets').doc(formattedEmail);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Unauthorized. Please restart the password reset process.' }, { status: 401 });
    }

    const data = doc.data()!;
    
    if (!data.verified) {
      return NextResponse.json({ error: 'OTP not verified.' }, { status: 401 });
    }

    const isValidToken = await bcrypt.compare(resetToken, data.resetTokenHash || '');
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid reset authorization.' }, { status: 401 });
    }

    if (Date.now() > data.resetExpiresAt) {
      await docRef.delete();
      return NextResponse.json({ error: 'Password reset session expired. Please request a new OTP.' }, { status: 401 });
    }

    const user = await adminAuth.getUserByEmail(formattedEmail);
    await adminAuth.updateUser(user.uid, { password: newPassword });

    await docRef.delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
