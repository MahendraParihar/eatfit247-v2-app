/* eslint-disable */
/**
 * Renders every EJS email template against representative sample data
 * and writes the resulting HTML into ./previews/ so designers and devs
 * can review the full email output in a browser.
 *
 * Usage (from server_1/):
 *   node templates/emails/render-previews.js
 *
 * Open `templates/emails/index.html` in a browser to see the gallery.
 */

const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'previews');

const franchise = {
  franchiseName: 'EatFit247',
  franchiseLogo: '', // set to a URL to render the image instead of the text wordmark
  brandColor: '#16a34a',
  supportEmail: 'support@eatfit247.com',
  footerText: '© 2026 EatFit247 Pvt. Ltd. All rights reserved.',
};

const samples = {
  'member/welcome': {
    franchise,
    memberName: 'Karan Saldhana',
    loginUrl: 'https://eatfit247.com/login',
  },
  'member/success-password': {
    franchise,
    memberName: 'Karan Saldhana',
    changeDate: '2026-05-23 14:02 IST',
    ipAddress: '49.207.214.10',
    loginUrl: 'https://eatfit247.com/login',
  },
  'member/reset-password': {
    franchise,
    memberName: 'Karan Saldhana',
    resetUrl: 'https://eatfit247.com/reset?token=abc',
    resetToken: 'abc',
    expiryHours: 24,
  },
  'member/plan-invoice': {
    franchise,
    memberName: 'Karan Saldhana',
    invoiceNumber: 'INV-2026-0042',
    invoiceDate: '23 May 2026',
    planName: 'Premium Coaching — 3 months',
    planDuration: '90 days',
    amount: '7,499',
    currency: '₹',
    paymentMethod: 'Razorpay (UPI)',
    transactionId: 'pay_NXm8Hg23',
    invoiceUrl: 'https://eatfit247.com/invoice/42',
  },
  'member/product-invoice': {
    franchise,
    memberName: 'Karan Saldhana',
    invoiceNumber: 'INV-2026-0099',
    invoiceDate: '23 May 2026',
    productName: 'Organic Whey Protein 1kg',
    productQuantity: 1,
    amount: '2,499',
    currency: '₹',
    paymentMethod: 'Razorpay (Card)',
    transactionId: 'pay_NXn5Ab90',
    invoiceUrl: 'https://eatfit247.com/invoice/99',
  },
  'member/product-order': {
    franchise,
    memberName: 'Karan Saldhana',
    orderNumber: 'ORD-2026-0501',
    orderDate: '23 May 2026',
    productName: 'Organic Whey Protein 1kg',
    quantity: 1,
    shippingAddress: '12 MG Road, Bengaluru 560001',
    estimatedDelivery: '27 May 2026',
    totalAmount: '2,499',
    currency: '₹',
    orderTrackingUrl: 'https://eatfit247.com/track/501',
  },
  'member/diet-plan': {
    franchise,
    memberName: 'Karan Saldhana',
    planName: 'Lean Cut — 12 Week',
    nutritionistName: 'Dr. Anjali Verma',
    assignedDate: '23 May 2026',
    planDuration: '12 weeks',
    planUrl: 'https://eatfit247.com/diet-plan/77',
  },
  'member/call-scheduled': {
    franchise,
    memberName: 'Karan Saldhana',
    callDate: 'Tue, 26 May 2026',
    callTime: '4:30 PM',
    timezone: 'Asia/Kolkata (IST)',
    nutritionistName: 'Dr. Anjali Verma',
    callType: 'Initial Consultation',
    meetingLink: 'https://meet.eatfit247.com/abc-defg-hij',
  },
  'member/call-rescheduled': {
    franchise,
    memberName: 'Karan Saldhana',
    newCallDate: 'Wed, 27 May 2026',
    newCallTime: '5:00 PM',
    timezone: 'Asia/Kolkata (IST)',
    nutritionistName: 'Dr. Anjali Verma',
    oldCallDate: 'Tue, 26 May 2026',
    oldCallTime: '4:30 PM',
    meetingLink: 'https://meet.eatfit247.com/abc-defg-hij',
  },
  'member/call-cancelled': {
    franchise,
    memberName: 'Karan Saldhana',
    callDate: 'Tue, 26 May 2026',
    callTime: '4:30 PM',
    cancellationReason: 'Nutritionist unavailable',
    cancelledDate: '23 May 2026, 11:00 IST',
    rescheduleUrl: 'https://eatfit247.com/book',
  },
  'member/inquiry-resolved': {
    franchise,
    memberName: 'Karan Saldhana',
    inquiryTitle: 'Issue with diet plan PDF download',
    resolvedBy: 'Support Agent Priya',
    resolvedDate: '23 May 2026, 12:00 IST',
    resolutionNote: 'PDF generation fixed and re-sent to your registered email.',
  },
  'admin/welcome': {
    franchise,
    adminName: 'Mahendra Parihar',
    adminEmail: 'mahendra@eatfit247.com',
    role: 'Super Admin',
    createdDate: '23 May 2026, 09:00 IST',
    temporaryPassword: true,
    loginUrl: 'https://admin.eatfit247.com/login',
  },
  'admin/success-password': {
    franchise,
    adminName: 'Mahendra Parihar',
    changeDate: '23 May 2026, 14:02 IST',
    ipAddress: '49.207.214.10',
    userAgent: 'Chrome 130 on macOS 26',
    loginUrl: 'https://admin.eatfit247.com/login',
  },
  'admin/forgot-password': {
    franchise,
    adminName: 'Mahendra Parihar',
    resetUrl: 'https://admin.eatfit247.com/reset?token=xyz',
    expiryHours: 12,
  },
  'contact/admin-contact-notification': {
    franchise,
    requestId: 'REQ-2026-0123',
    contactName: 'Priya Sharma',
    contactEmail: 'priya@example.com',
    contactPhone: '+91 98765 43210',
    subject: 'Question about meal customisation',
    message: 'Hi, can I customise the lunch meals to be vegetarian only?',
    submittedDate: '23 May 2026, 10:15 IST',
    memberId: 'M-4521',
    adminUrl: 'https://admin.eatfit247.com/inquiries/123',
  },
  'contact/admin-contact-response': {
    franchise,
    memberName: 'Priya Sharma',
    originalSubject: 'Question about meal customisation',
    responseDate: '23 May 2026, 14:00 IST',
    respondedBy: 'Dr. Anjali Verma',
    responseMessage:
      'Yes! Open Settings → Preferences and switch Diet Type to "Vegetarian". Your plan will refresh within 24h.',
  },
  'contact/member-contact-request': {
    franchise,
    memberName: 'Priya Sharma',
    requestId: 'REQ-2026-0123',
    subject: 'Question about meal customisation',
    message: 'Hi, can I customise the lunch meals to be vegetarian only?',
    submittedDate: '23 May 2026, 10:15 IST',
  },
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  let pass = 0,
    fail = 0;
  for (const [tpl, data] of Object.entries(samples)) {
    const src = path.join(TEMPLATES_DIR, tpl + '.ejs');
    const out = path.join(OUT_DIR, tpl.replace('/', '__') + '.html');
    try {
      const html = await ejs.renderFile(src, data, { async: true });
      fs.writeFileSync(out, html, 'utf-8');
      console.log('  ✓', tpl, '→', path.relative(process.cwd(), out));
      pass++;
    } catch (e) {
      console.log('  ✗', tpl, '—', e.message);
      fail++;
    }
  }
  console.log(`\n${pass}/${pass + fail} previews written to ${path.relative(process.cwd(), OUT_DIR)}/`);
  process.exit(fail > 0 ? 1 : 0);
})();
