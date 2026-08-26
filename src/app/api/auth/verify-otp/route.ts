import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    const formattedEmail = email.trim().toLowerCase();

    const docRef = adminDb.collection('password_resets').doc(formattedEmail);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'This password reset link is invalid or has already been used.' }, { status: 400 });
    }

    const data = doc.data()!;
    
    if (data.verified) {
      return NextResponse.json({ error: 'OTP already verified' }, { status: 400 });
    }

    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'This OTP has expired. Please request a new OTP.' }, { status: 400 });
    }

    if (data.attempts >= 5) {
      await docRef.delete();
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(otp, data.hash);
    
    if (!isValid) {
      const newAttempts = data.attempts + 1;
      await docRef.update({ attempts: newAttempts });
      
      if (newAttempts >= 5) {
        await docRef.delete();
        return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    // OTP verified correctly
    const resetExpiresAt = Date.now() + 15 * 60 * 1000;
    await docRef.update({ 
      verified: true,
      resetExpiresAt
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
