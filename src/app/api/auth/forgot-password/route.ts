import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

export async function POST(req: Request) {
  try {
    console.log('[FORGOT PASSWORD] Request received');
    
    // 1. Validate environment
    const requiredEnv = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    const missingVars = [];
    for (const envVar of requiredEnv) {
      if (process.env[envVar]) {
        console.log(`[FORGOT PASSWORD] ${envVar}: configured`);
      } else {
        console.log(`[FORGOT PASSWORD] ${envVar}: MISSING`);
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      console.error(`[FORGOT PASSWORD] ERROR: Missing required configuration variables: ${missingVars.join(', ')}`);
      return NextResponse.json({ success: false, code: "SERVER_NOT_CONFIGURED", message: "Unable to process the request right now." }, { status: 500 });
    }

    if (!getApps().length) {
      console.error('[FORGOT PASSWORD] ERROR: FIREBASE_NOT_CONFIGURED. Database not initialized.');
      return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
    }

    // 2. Parse request
    const { email } = await req.json();
    if (!email) {
      console.error('[FORGOT PASSWORD] ERROR: Missing email in request body');
      return NextResponse.json({ success: false, code: "INVALID_REQUEST", message: "Email is required" }, { status: 400 });
    }
    const formattedEmail = email.trim().toLowerCase();
    console.log('[FORGOT PASSWORD] Email validated');

    // 3. User Lookup
    let userExists = true;
    try {
      await adminAuth.getUserByEmail(formattedEmail);
      console.log('[FORGOT PASSWORD] User lookup completed');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userExists = false;
        console.log('[FORGOT PASSWORD] User not found, proceeding with safe response');
      } else {
        console.error('[FORGOT PASSWORD] Database error during user lookup:', e);
        return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
      }
    }

    if (userExists) {
      // 4. Generate OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      console.log('[FORGOT PASSWORD] OTP generated');
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(otp, salt);
      const expiresAt = Date.now() + 10 * 60 * 1000;

      // 5. Store OTP
      try {
        await adminDb.collection('password_resets').doc(formattedEmail).set({
          hash,
          expiresAt,
          attempts: 0,
          verified: false,
          createdAt: FieldValue.serverTimestamp()
        });
        console.log('[FORGOT PASSWORD] OTP stored');
      } catch (dbError) {
        console.error('[FORGOT PASSWORD] Database error storing OTP:', dbError);
        return NextResponse.json({ success: false, code: "DATABASE_ERROR", message: "Unable to process the request right now." }, { status: 500 });
      }

      // 6. Send Email
      console.log('[FORGOT PASSWORD] Email sending started');
      const subject = 'CalmHire Password Reset OTP';
      const text = `Hello,\n\nYour CalmHire password reset verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nRegards,\nCalmHire`;
      
      try {
        await sendEmail(formattedEmail, subject, text);
        console.log('[FORGOT PASSWORD] Email sent successfully');
      } catch (emailError) {
        console.error('[FORGOT PASSWORD] Email failed:', emailError);
        return NextResponse.json({ success: false, code: "OTP_SEND_FAILED", message: "Unable to send the verification code right now." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'If an account exists for this email, a verification code has been sent.' });

  } catch (error) {
    console.error('[FORGOT PASSWORD] ERROR:', error);
    return NextResponse.json({ success: false, code: "INTERNAL_ERROR", message: "Unable to send the verification code right now. Please try again." }, { status: 500 });
  }
}
