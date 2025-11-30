-- Update Password Reset Email Template for OTP
-- EmailTypeEnum.PASSWORD_RESET = 3
-- This updates the existing template to support OTP-based password reset

-- Update Password Reset Email Template
UPDATE mst_email_templates
SET
    template_name = 'Password Reset OTP',
    subject = 'Password Reset OTP - EatFit247',
    body = 
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
            font-family: "Courier New", monospace;
        }
        .message {
            color: #666;
            margin-top: 20px;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-text {
            color: #856404;
            font-size: 13px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">EatFit247</div>
            <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
        </div>
        
        <div class="content">
            <p>Hello <strong>REPLACE_NAME</strong>,</p>
            
            <p>We received a request to reset your password for your EatFit247 account. Use the OTP below to complete the password reset process:</p>
            
            <div class="otp-box">
                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Your OTP Code:</div>
                <div class="otp-code">REPLACE_OTP</div>
            </div>
            
            <div class="warning">
                <p class="warning-text">
                    <strong>⚠️ Important:</strong> This OTP is valid for 30 minutes only. 
                    If you did not request a password reset, please ignore this email or contact our support team immediately.
                </p>
            </div>
            
            <p class="message">
                <strong>REPLACE_MESSAGE</strong>
            </p>
            
            <p style="margin-top: 20px;">
                If you have any questions or need assistance, please don''t hesitate to contact our support team.
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 EatFit247. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>',
    modified_by = 1, -- admin_id = 1, adjust if needed
    updated_at = NOW()
WHERE email_template_id = 3;

-- Verify the update
SELECT 
    email_template_id,
    template_name,
    subject,
    active,
    updated_at
FROM mst_email_templates 
WHERE email_template_id = 3;

