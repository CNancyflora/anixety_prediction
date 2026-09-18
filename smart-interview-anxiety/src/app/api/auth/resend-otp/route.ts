import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

export async function POST(req: Request) {
  try {
    console.log('[RESEND OTP] Request received');
    
    // 1. Validate environment
    const requiredEnv = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'BREVO_API_KEY'
    ];

    const missingVars = [];
    for (const envVar of requiredEnv) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      return NextResponse.json({ success: false, code: "SERVER_NOT_CONFIGURED", message: "Unable to process the request right now." }, { status: 500 });
    }

    if (!getApps().length) {
      return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
    }

    // 2. Parse request
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, code: "INVALID_REQUEST", message: "Email is required" }, { status: 400 });
    }
    const formattedEmail = email.trim().toLowerCase();

    // 3. User Lookup
    let userExists = true;
    try {
      await adminAuth.getUserByEmail(formattedEmail);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userExists = false;
      } else {
        return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
      }
    }

    if (userExists) {
      const docRef = adminDb.collection('password_resets').doc(formattedEmail);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        if (data?.createdAt) {
          const createdAt = data.createdAt.toDate().getTime();
          const now = Date.now();
          if (now - createdAt < 60 * 1000) {
            return NextResponse.json({ success: false, code: "COOLDOWN_ACTIVE", message: "Please wait 60 seconds before requesting a new OTP." }, { status: 429 });
          }
        }
      }

      // 4. Generate New OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(otp, salt);
      const expiresAt = Date.now() + 5 * 60 * 1000;

      // 5. Store new OTP (overwrites previous)
      try {
        await docRef.set({
          hash,
          expiresAt,
          attempts: 0,
          verified: false,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (dbError) {
        return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
      }

      // 6. Send Email
      const subject = 'Your CalmHire Password Reset OTP';
      const text = `Hello,\n\nWe received a request to reset your CalmHire password.\n\nYour verification code is:\n\n${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nRegards,\nCalmHire Team`;
      
      try {
        await sendEmail(formattedEmail, subject, text);
      } catch (emailError) {
        return NextResponse.json({ success: false, code: "OTP_SEND_FAILED", message: "Unable to send the verification code right now." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'If an account exists for this email, a new verification code has been sent.' });

  } catch (error) {
    console.error('[RESEND OTP] ERROR:', error);
    return NextResponse.json({ success: false, code: "INTERNAL_ERROR", message: "Unable to send the verification code right now. Please try again." }, { status: 500 });
  }
}
