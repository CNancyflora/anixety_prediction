export const sendEmail = async (to: string, subject: string, text: string) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\n=== [DEV MODE] Simulated Email to ${to} ===\nSubject: ${subject}\n\n${text}\n===========================================\n`);
    }
    return true;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@calmhire.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'CalmHire';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      textContent: text,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[BREVO EMAIL ERROR]:', errorText);
    throw new Error('Failed to send email via Brevo');
  }
};
