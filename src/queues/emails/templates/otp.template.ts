export const otpEmailTemplate = (otp: string, name: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #4F46E5; padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .body { padding: 40px 30px; }
    .otp-box { background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 40px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LMS Platform</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your one-time password (OTP) for verification is:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br/>The LMS Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Infinix Techcloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
