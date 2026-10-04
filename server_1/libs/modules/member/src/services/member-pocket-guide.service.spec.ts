import { promises as fs } from 'fs';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { IAuthUser, IMediaUpload } from '@eatfit247-shared-lib';
import { Env } from '@server_1/core';
import { MstPocketGuide } from '@server_1/modules/pocket-guide';
import type { EmailNotificationService } from '@server_1/platform';
import { TxnMember, TxnMemberPocketGuide } from '../models';
import {
  IAssignedPocketGuide,
  IPocketGuideEmailRecipient,
  MemberPocketGuideService,
  POCKET_GUIDE_ASSIGNED_TEMPLATE,
  POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES,
} from './member-pocket-guide.service';

type EmailTemplate = NonNullable<Awaited<ReturnType<EmailNotificationService['getNotificationTemplate']>>>;
type SendParams = Parameters<EmailNotificationService['sendEmailFromTemplate']>[1];

const upload = (webUrl: string): IMediaUpload => ({
  fieldName: 'file',
  originalName: path.basename(webUrl),
  encoding: '7bit',
  mimetype: 'application/pdf',
  fileName: path.basename(webUrl),
  size: 10,
  webUrl,
});

const user = (franchiseIds: number[]): IAuthUser => ({ adminId: 7, emailId: 'staff@eatfit247.com', roleKeys: [], franchiseIds });

describe('MemberPocketGuideService', () => {
  const folder = path.join(Env.privateAssetPath, 'pocket-guide');

  const memberRepository = { findOne: jest.fn() };
  const assignmentRepository = { findOne: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), bulkCreate: jest.fn() };
  const pocketGuideRepository = { findOne: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() };
  const transaction = { commit: jest.fn(), rollback: jest.fn() };
  const sequelize = { transaction: jest.fn().mockResolvedValue(transaction) };
  const emailService = { getNotificationTemplate: jest.fn(), sendEmailFromTemplate: jest.fn() };

  const service = new MemberPocketGuideService(
    assignmentRepository as unknown as typeof TxnMemberPocketGuide,
    memberRepository as unknown as typeof TxnMember,
    pocketGuideRepository as unknown as typeof MstPocketGuide,
    sequelize as unknown as Sequelize,
    emailService as unknown as EmailNotificationService,
  );

  const template = { subject: 'Your Pocket Guides — {{franchiseName}}', sendEmailNotification: true } as EmailTemplate;

  beforeAll(async () => {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'DetoxDiet.pdf'), 'pdf');
    // Sparse files: real sizes without writing megabytes
    await fs.writeFile(path.join(folder, 'Big1.pdf'), '');
    await fs.truncate(path.join(folder, 'Big1.pdf'), 10 * 1024 * 1024);
    await fs.writeFile(path.join(folder, 'Big2.pdf'), '');
    await fs.truncate(path.join(folder, 'Big2.pdf'), 10 * 1024 * 1024);
  });

  afterAll(async () => {
    await fs.rm(Env.privateAssetPath, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(transaction);
  });

  describe('getDownloadFile', () => {
    const assignedGuide = (filePath: IMediaUpload[] | null, active = true) => {
      memberRepository.findOne.mockResolvedValue({ memberId: 1, franchiseId: 10 });
      assignmentRepository.findOne.mockResolvedValue({ memberPocketGuideId: 100 });
      pocketGuideRepository.findOne.mockResolvedValue({ pocketGuideId: 9, pocketGuide: 'Detox Diet', filePath, active });
    };

    it('returns the PDF of a guide assigned to a member in one of the caller\'s franchises', async () => {
      assignedGuide([upload('private://pocket-guide/DetoxDiet.pdf')]);
      const file = await service.getDownloadFile(1, 9, user([10, 11]));
      expect(file.downloadFileName).toBe('Detox Diet.pdf');
      expect(assignmentRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { memberId: 1, pocketGuideId: 9 } }));
    });

    it('allows an unscoped caller (no franchises, e.g. Super Admin)', async () => {
      assignedGuide([upload('private://pocket-guide/DetoxDiet.pdf')]);
      await expect(service.getDownloadFile(1, 9, user([]))).resolves.toBeDefined();
    });

    it('allows an inactive guide that is assigned (no active filter)', async () => {
      assignedGuide([upload('private://pocket-guide/DetoxDiet.pdf')], false);
      await expect(service.getDownloadFile(1, 9, user([10]))).resolves.toBeDefined();
      expect(pocketGuideRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { pocketGuideId: 9 } }));
    });

    it('404s for a member outside the caller\'s franchises, without checking the assignment', async () => {
      assignedGuide([upload('private://pocket-guide/DetoxDiet.pdf')]);
      await expect(service.getDownloadFile(1, 9, user([20]))).rejects.toThrow(new NotFoundException('Member not found'));
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
    });

    it('404s for an unknown member', async () => {
      memberRepository.findOne.mockResolvedValue(null);
      await expect(service.getDownloadFile(1, 9, user([]))).rejects.toThrow('Member not found');
    });

    it('404s for a guide not assigned to the member', async () => {
      assignedGuide([upload('private://pocket-guide/DetoxDiet.pdf')]);
      assignmentRepository.findOne.mockResolvedValue(null);
      await expect(service.getDownloadFile(1, 9, user([10]))).rejects.toThrow('Pocket guide is not assigned to this member');
    });

    it('404s with a clear message when the file is missing on disk', async () => {
      assignedGuide([upload('private://pocket-guide/Gone.pdf')]);
      await expect(service.getDownloadFile(1, 9, user([10]))).rejects.toThrow('Pocket guide file is missing on the server');
    });

    it('404s when the guide has no file', async () => {
      assignedGuide(null);
      await expect(service.getDownloadFile(1, 9, user([10]))).rejects.toThrow('This pocket guide has no file');
    });
  });

  describe('sendAssignmentEmail', () => {
    const recipient: IPocketGuideEmailRecipient = {
      memberId: 1,
      emailId: 'member@example.com',
      memberName: 'Karan Saldhana',
      franchiseName: 'EatFit247 Mumbai',
    };
    const guide = (pocketGuideId: number, pocketGuide: string, webUrl: string | null): IAssignedPocketGuide => ({
      pocketGuideId,
      pocketGuide,
      filePath: webUrl ? [upload(webUrl)] : null,
    });
    const sentParams = (): SendParams => emailService.sendEmailFromTemplate.mock.calls[0][1] as SendParams;

    beforeEach(() => emailService.getNotificationTemplate.mockResolvedValue(template));

    it('attaches the PDFs with friendly names and fills the subject', async () => {
      await service.sendAssignmentEmail(recipient, [guide(9, 'Detox Diet', 'private://pocket-guide/DetoxDiet.pdf')]);
      expect(emailService.getNotificationTemplate).toHaveBeenCalledWith(POCKET_GUIDE_ASSIGNED_TEMPLATE);
      const params = sentParams();
      expect(params.to).toBe('member@example.com');
      expect(params.subject).toBe('Your Pocket Guides — EatFit247 Mumbai');
      expect(params.attachments).toEqual([
        { filename: 'Detox Diet.pdf', path: path.join(folder, 'DetoxDiet.pdf'), contentType: 'application/pdf' },
      ]);
      expect(params.data).toEqual(
        expect.objectContaining({
          franchise: { franchiseName: 'EatFit247 Mumbai' },
          guides: [{ name: 'Detox Diet', attached: true }],
          attachedCount: 1,
        }),
      );
    });

    it('still sends when a file is missing or absent, listing those guides as not attached', async () => {
      await service.sendAssignmentEmail(recipient, [
        guide(9, 'Detox Diet', 'private://pocket-guide/DetoxDiet.pdf'),
        guide(10, 'Gone Guide', 'private://pocket-guide/Gone.pdf'),
        guide(11, 'No File Guide', null),
      ]);
      const params = sentParams();
      expect(params.attachments).toHaveLength(1);
      expect(params.data['guides']).toEqual([
        { name: 'Detox Diet', attached: true },
        { name: 'Gone Guide', attached: false },
        { name: 'No File Guide', attached: false },
      ]);
    });

    it('stops attaching once the size limit would be exceeded', async () => {
      expect(POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES).toBeLessThan(20 * 1024 * 1024);
      await service.sendAssignmentEmail(recipient, [
        guide(1, 'Big One', 'private://pocket-guide/Big1.pdf'),
        guide(2, 'Big Two', 'private://pocket-guide/Big2.pdf'),
        guide(9, 'Detox Diet', 'private://pocket-guide/DetoxDiet.pdf'),
      ]);
      const params = sentParams();
      expect(params.attachments?.map((a) => a.filename)).toEqual(['Big One.pdf', 'Detox Diet.pdf']);
      expect(params.data['attachedCount']).toBe(2);
    });

    it('falls back to EatFit247 when the member has no franchise name', async () => {
      await service.sendAssignmentEmail({ ...recipient, franchiseName: undefined }, [guide(9, 'Detox Diet', 'private://pocket-guide/DetoxDiet.pdf')]);
      expect(sentParams().subject).toBe('Your Pocket Guides — EatFit247');
    });

    it('skips the email when the template is missing', async () => {
      emailService.getNotificationTemplate.mockResolvedValue(null);
      await service.sendAssignmentEmail(recipient, [guide(9, 'Detox Diet', 'private://pocket-guide/DetoxDiet.pdf')]);
      expect(emailService.sendEmailFromTemplate).not.toHaveBeenCalled();
    });
  });

  describe('manage', () => {
    it('emails only the newly assigned guides', async () => {
      const sendSpy = jest.spyOn(service, 'sendAssignmentEmail').mockResolvedValue();
      memberRepository.findOne.mockResolvedValue({
        memberId: 1,
        emailId: 'member@example.com',
        firstName: 'Karan',
        lastName: 'Saldhana',
        franchise: { companyName: 'EatFit247 Mumbai' },
      });
      assignmentRepository.findAll.mockResolvedValue([{ pocketGuideId: 9 }]);
      const detox = { pocketGuideId: 9, pocketGuide: 'Detox Diet', filePath: [upload('private://pocket-guide/DetoxDiet.pdf')] };
      const travel = { pocketGuideId: 13, pocketGuide: 'Travel guide', filePath: null };
      pocketGuideRepository.findAll.mockResolvedValue([detox, travel]);

      await service.manage(1, [9, 13], '127.0.0.1', 7);

      expect(transaction.commit).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(
        { memberId: 1, emailId: 'member@example.com', memberName: 'Karan Saldhana', franchiseName: 'EatFit247 Mumbai' },
        [travel],
      );
      sendSpy.mockRestore();
    });
  });

  describe('getList', () => {
    const row = (filePath: IMediaUpload[] | null) => ({
      pocketGuideId: 9,
      pocketGuide: 'Detox Diet',
      filePath,
      txn_member_pocket_guide: { memberPocketGuideId: 100, createdByUser: {}, updatedByUser: {} },
    });

    beforeEach(() => {
      memberRepository.findOne.mockResolvedValue({ memberId: 1 });
      jest.spyOn(MstPocketGuide, 'belongsTo').mockReturnValue(undefined as unknown as ReturnType<typeof MstPocketGuide.belongsTo>);
    });

    it('maps the file flag and download name', async () => {
      pocketGuideRepository.findAndCountAll.mockResolvedValue({ rows: [row([upload('private://pocket-guide/DetoxDiet.pdf')])], count: 1 });
      const list = await service.getList(1, true);
      expect(list.tableData[0]).toEqual(expect.objectContaining({ hasFile: true, downloadFileName: 'Detox Diet.pdf', isSelected: true }));
    });

    it('keeps inactive guides in the assigned list but not in the picker', async () => {
      pocketGuideRepository.findAndCountAll.mockResolvedValue({ rows: [row(null)], count: 1 });
      await service.getList(1, true);
      expect(pocketGuideRepository.findAndCountAll).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
      await service.getList(1, false);
      expect(pocketGuideRepository.findAndCountAll).toHaveBeenLastCalledWith(expect.objectContaining({ where: { active: true } }));
    });
  });
});
