import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as ejs from 'ejs';
import { EmailNotificationService, MstEmailTemplate } from '@server_1/platform';
import { NotificationChannel } from '@eatfit247-shared-lib';
import { LogService, NotificationService } from '../services';
import { EmailTemplateService } from '../services/email-template.service';
import { MemberCreatedPayload, NotificationListener, memberWelcomeKey } from './notification.listener';

/** Configurable tax treatment group 8 (decision 18): template switches, the welcome email (A32) and the diet plan's switch (A26). */
describe('NotificationListener (email template switches)', () => {
  let templates: Record<string, Partial<MstEmailTemplate> | null>;
  /** notification_logs: key → status and last update (the unique idempotency key) */
  let logs: Map<string, { status: string; updatedAt: Date }>;
  let ids: string[];
  let sendEmailFromTemplate: jest.Mock;
  let send: jest.Mock;
  let createPending: jest.Mock;
  let markSent: jest.Mock;
  let markFailed: jest.Mock;
  let listener: NotificationListener;

  const welcome = (fields: Partial<MstEmailTemplate> = {}): Partial<MstEmailTemplate> => ({
    templateName: 'member_welcome',
    subject: 'Welcome to {{franchiseName}}!',
    emailTemplateFile: 'member/welcome',
    whatsppTemplateFile: 'whatsapp/member/welcome',
    active: true,
    sendEmailNotification: true,
    sendWhatsappNotification: false,
    ...fields,
  });
  const member: MemberCreatedPayload = {
    memberId: 501,
    memberName: 'QA Welcome',
    emailId: 'qa.welcome@eatfit247.test',
    phoneNumber: '+91 9000000001',
    franchiseName: 'EAT FIT 247',
    supportEmail: 'support@eatfit247.test',
    supportPhone: '+91 9000000000',
  };

  beforeEach(() => {
    // getNotificationTemplate returns active templates only (as the platform service does)
    templates = { member_welcome: null, member_diet_plan: null };
    logs = new Map();
    ids = [];
    const insert = (key: string): number => {
      if (logs.has(key)) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), { name: 'SequelizeUniqueConstraintError' });
      }
      logs.set(key, { status: 'pending', updatedAt: new Date() });
      ids.push(key);
      return ids.length;
    };
    sendEmailFromTemplate = jest.fn().mockResolvedValue(true);
    // NotificationService.send: logs pending, then sent (or failed and throws)
    send = jest.fn().mockImplementation(async (dto: { idempotencyKey: string }) => {
      insert(dto.idempotencyKey);
      logs.set(dto.idempotencyKey, { status: 'sent', updatedAt: new Date() });
      return { messageId: 'wa-1', success: true };
    });
    createPending = jest.fn().mockImplementation(async (dto: { idempotencyKey: string }) => ({ id: insert(dto.idempotencyKey) }));
    markSent = jest.fn().mockImplementation(async (id: number) => logs.set(ids[id - 1], { status: 'sent', updatedAt: new Date() }));
    markFailed = jest.fn().mockImplementation(async (id: number) => logs.set(ids[id - 1], { status: 'failed', updatedAt: new Date() }));
    listener = new NotificationListener(
      { send } as unknown as NotificationService,
      {
        getNotificationTemplate: jest.fn().mockImplementation(async (name: string) => {
          const template = templates[name];
          return template && template.active ? template : null;
        }),
        renderWhatsAppFromTemplate: jest.fn().mockImplementation(async (template: MstEmailTemplate, vars: Record<string, string>) =>
          template.sendWhatsappNotification ? `Hello ${vars.memberName}, welcome to ${vars.franchiseName}` : null,
        ),
        sendEmailFromTemplate,
      } as unknown as EmailNotificationService,
      {
        attempts: jest.fn().mockImplementation(async (base: string) =>
          [...logs.entries()]
            .filter(([key]) => key === base || key.startsWith(`${base}-`))
            .map(([idempotencyKey, row]) => ({ idempotencyKey, ...row })),
        ),
        createPending,
        markSent,
        markFailed,
      } as unknown as LogService,
    );
  });

  describe('A32: the welcome email', () => {
    it('inactive (as 149 ships it): a new member gets nothing', async () => {
      templates.member_welcome = welcome({ active: false });
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    it('activated: one welcome email through member/welcome with the franchise in the subject, logged as sent', async () => {
      templates.member_welcome = welcome();
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).toHaveBeenCalledTimes(1);
      const [template, params] = sendEmailFromTemplate.mock.calls[0];
      expect(template.emailTemplateFile).toBe('member/welcome');
      expect(params).toMatchObject({
        to: 'qa.welcome@eatfit247.test',
        subject: 'Welcome to EAT FIT 247!',
        data: { memberName: 'QA Welcome', franchise: { franchiseName: 'EAT FIT 247', supportEmail: 'support@eatfit247.test' } },
      });
      expect(params.data.loginUrl).toBeUndefined();
      expect(createPending.mock.calls[0][0]).toMatchObject({ channel: NotificationChannel.EMAIL, idempotencyKey: memberWelcomeKey(501, 'email'), memberId: 501 });
      expect(markSent).toHaveBeenCalledTimes(1);
      expect(send).not.toHaveBeenCalled();
    });

    it('a duplicate member.created sends no second email (also when two arrive together)', async () => {
      templates.member_welcome = welcome();
      await listener.handleMemberCreated(member);
      await listener.handleMemberCreated(member);
      await Promise.all([listener.handleMemberCreated({ ...member, memberId: 502 }), listener.handleMemberCreated({ ...member, memberId: 502 })]);
      expect(sendEmailFromTemplate.mock.calls.map((call) => call[1].to)).toHaveLength(2);
    });

    it('with its WhatsApp switch on: one WhatsApp message too, once', async () => {
      templates.member_welcome = welcome({ sendWhatsappNotification: true });
      await listener.handleMemberCreated(member);
      await listener.handleMemberCreated(member);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0]).toMatchObject({ channel: NotificationChannel.WHATSAPP, recipient: '+91 9000000001', idempotencyKey: memberWelcomeKey(501, 'wa') });
    });

    it('its email switch off: no email, even while active', async () => {
      templates.member_welcome = welcome({ sendEmailNotification: false });
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).not.toHaveBeenCalled();
    });

    it('a failed send is logged as failed and never breaks the caller; a repeat event sends it as attempt 2, then no more', async () => {
      templates.member_welcome = welcome();
      sendEmailFromTemplate.mockResolvedValueOnce(false);
      await expect(listener.handleMemberCreated(member)).resolves.toBeUndefined();
      expect(logs.get(memberWelcomeKey(501, 'email'))?.status).toBe('failed');
      await listener.handleMemberCreated(member);
      expect(logs.get(`${memberWelcomeKey(501, 'email')}-2`)?.status).toBe('sent');
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).toHaveBeenCalledTimes(2);
    });

    it('a fresh pending attempt blocks a second one; a stale one (crashed mid-send) does not', async () => {
      templates.member_welcome = welcome();
      logs.set(memberWelcomeKey(501, 'email'), { status: 'pending', updatedAt: new Date() });
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).not.toHaveBeenCalled();
      logs.set(memberWelcomeKey(501, 'email'), { status: 'pending', updatedAt: new Date(Date.now() - 20 * 60 * 1000) });
      await listener.handleMemberCreated(member);
      expect(sendEmailFromTemplate).toHaveBeenCalledTimes(1);
      expect(logs.get(`${memberWelcomeKey(501, 'email')}-2`)?.status).toBe('sent');
    });

    it('a database error that is not a key clash sends nothing and never breaks the caller', async () => {
      templates.member_welcome = welcome();
      createPending.mockRejectedValueOnce(new Error('connection terminated'));
      await expect(listener.handleMemberCreated(member)).resolves.toBeUndefined();
      expect(sendEmailFromTemplate).not.toHaveBeenCalled();
    });

    it('a failed WhatsApp is retried on a repeat event (attempt 2)', async () => {
      templates.member_welcome = welcome({ sendWhatsappNotification: true, sendEmailNotification: false });
      send.mockImplementationOnce(async (dto: { idempotencyKey: string }) => {
        logs.set(dto.idempotencyKey, { status: 'failed', updatedAt: new Date() });
        throw new Error('Meta: re-engagement message');
      });
      await expect(listener.handleMemberCreated(member)).resolves.toBeUndefined();
      await listener.handleMemberCreated(member);
      expect(send.mock.calls.map((call) => call[0].idempotencyKey)).toEqual([memberWelcomeKey(501, 'wa'), `${memberWelcomeKey(501, 'wa')}-2`]);
    });
  });

  describe('A26: the diet plan honours its email switch', () => {
    const diet = { memberId: 501, memberName: 'QA Welcome', emailId: 'qa.welcome@eatfit247.test', phoneNumber: '', dietPlanId: 9, cycleNo: 1 };
    const dietTemplate = (sendEmailNotification: boolean): Partial<MstEmailTemplate> => ({
      templateName: 'member_diet_plan',
      emailTemplateFile: 'member/diet-plan',
      active: true,
      sendEmailNotification,
      sendWhatsappNotification: false,
    });

    it('switched off: no email', async () => {
      templates.member_diet_plan = dietTemplate(false);
      await listener.handleDietPlanGenerated(diet);
      expect(sendEmailFromTemplate).not.toHaveBeenCalled();
    });

    it('switched on: the email is sent', async () => {
      templates.member_diet_plan = dietTemplate(true);
      await listener.handleDietPlanGenerated(diet);
      expect(sendEmailFromTemplate).toHaveBeenCalledTimes(1);
    });
  });

  describe('the real EJS templates render with the data the listener passes', () => {
    const TEMPLATES = path.resolve(__dirname, '../../../../../templates');
    const render = (file: string, data: Record<string, unknown>): Promise<string> =>
      ejs.renderFile(path.join(TEMPLATES, `${file}.ejs`), data, { async: true });

    it('member/diet-plan (it failed with a ReferenceError before group 8)', async () => {
      templates.member_diet_plan = { templateName: 'member_diet_plan', emailTemplateFile: 'member/diet-plan', active: true, sendEmailNotification: true };
      await listener.handleDietPlanGenerated({ memberId: 1, memberName: 'QA Diet', emailId: 'qa@eatfit247.test', phoneNumber: '', dietPlanId: 9, cycleNo: 2, dayNo: 3, franchiseName: 'EAT FIT 247' });
      const html = await render('member/diet-plan', sendEmailFromTemplate.mock.calls[0][1].data);
      expect(html).toContain('QA Diet');
      expect(html).toContain('Cycle 2 - Day 3');
      expect(html).toContain('EAT FIT 247');
    });

    it('member/welcome, without a login button (no member website URL)', async () => {
      templates.member_welcome = welcome();
      await listener.handleMemberCreated(member);
      const html = await render('member/welcome', sendEmailFromTemplate.mock.calls[0][1].data);
      expect(html).toContain('Welcome, QA Welcome.');
      expect(html).toContain('EAT FIT 247');
      expect(html).not.toContain('Open my account');
    });
  });
});

describe('EmailTemplateService (switches only)', () => {
  let row: Partial<MstEmailTemplate> & { update: jest.Mock };
  let service: EmailTemplateService;

  beforeEach(() => {
    row = {
      emailTemplateId: 1,
      templateName: 'member_welcome',
      subject: 'Welcome to {{franchiseName}}!',
      whatsppTemplateFile: 'whatsapp/member/welcome',
      active: false,
      sendEmailNotification: true,
      sendWhatsappNotification: true,
      update: jest.fn().mockImplementation(async (changes: Partial<MstEmailTemplate>) => Object.assign(row, changes)),
    };
    service = new EmailTemplateService({
      findByPk: jest.fn().mockImplementation(async (id: number) => (id === 1 ? row : null)),
      findAll: jest.fn().mockResolvedValue([row]),
    } as unknown as typeof MstEmailTemplate);
  });

  it('lists every template with its three switches', async () => {
    await expect(service.findAll()).resolves.toEqual([
      { emailTemplateId: 1, templateName: 'member_welcome', subject: 'Welcome to {{franchiseName}}!', active: false, sendEmailNotification: true, sendWhatsappNotification: true },
    ]);
  });

  it('changes only the switches sent, with the admin who did it', async () => {
    await expect(service.update(1, { active: true }, 19)).resolves.toMatchObject({ active: true, sendEmailNotification: true });
    expect(row.update).toHaveBeenCalledWith({ active: true, modifiedBy: 19 });
  });

  it('an unknown template is a 404; no switch, or WhatsApp on a template without a message, is a 400', async () => {
    await expect(service.update(9, { active: true }, 19)).rejects.toThrow(NotFoundException);
    await expect(service.update(1, {}, 19)).rejects.toThrow(BadRequestException);
    row.whatsppTemplateFile = '';
    await expect(service.update(1, { sendWhatsappNotification: true }, 19)).rejects.toThrow('has no WhatsApp message');
    await expect(service.update(1, { sendWhatsappNotification: false }, 19)).resolves.toMatchObject({ sendWhatsappNotification: false });
  });
});
