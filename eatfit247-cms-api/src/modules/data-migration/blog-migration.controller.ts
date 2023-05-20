import { InjectModel } from '@nestjs/sequelize';
import { Controller, Get } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { exit } from '@nestjs/cli/actions';
import { TxnBlog } from '../../core/database/models/txn-blog.model';
import { TxnSubscriber } from '../../core/database/models/txn-subscriber.model';
import { TxnContactForm } from '../../core/database/models/txn-contact-form.model';
import * as moment from 'moment';
import { CommonFunctionsUtil } from '../../util/common-functions-util';

@Controller('migration')
export class BlogMigrationController {
  folderPath = '/Users/mahendraparihar/Projects/EatFit247/Migration';

  constructor(
    @InjectModel(TxnBlog) private readonly blogRepository: typeof TxnBlog,
    @InjectModel(TxnSubscriber) private readonly subscriberRepository: typeof TxnSubscriber,
    @InjectModel(TxnContactForm) private readonly contactFormRepository: typeof TxnContactForm,
    private sequelize: Sequelize,
  ) {
  }

  @Get('blogs')
  async init() {
    const t = await this.sequelize.transaction();

    try {
      try {
        await this.createBlog();
      } catch (e) {
        console.log(e);
        await t.rollback();
        exit();
      }

      try {
        await this.createSubscription();
      } catch (e) {
        console.log(e);
        await t.rollback();
        exit();
      }

      try {
        await this.createContactUs();
      } catch (e) {
        console.log(e);
        await t.rollback();
        exit();
      }

      await t.commit();
    } catch (e) {
      throw e;
    }
  }

  private async createBlog() {
    try {
      const insertList = [];
      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_blogs.json`), 'utf8'));
      for (const pln of tempV1List) {
        insertList.push({
          blogCategoryId: Number(pln.blog_category_id),
          blogAuthorId: Number(pln.author_id),
          title: pln.title,
          description: pln.description,
          imagePath: [
            {
              size: 227093,
              webUrl: 'media-files/' + pln.image_path,
              encoding: '7bit',
              fileName: pln.image_path,
              mimetype: 'image/jpeg',
              fieldName: 'file',
              originalName: pln.title + '.jpg',
            },
          ],
          is_Published: !(Number(pln.is_published) === 0),
          isCommentAllow: Number(pln.is_comment_allow) === 1,
          isMailSentToSubscriber: Number(pln.is_mail_sent_to_subscriber) === 1,
          visitedCount: Number(pln.visited_count),
          shareCount: Number(pln.share_count),
          tags: pln.meta_tags ? pln.meta_tags : pln.title,
          writtenAt: moment(pln.written_at),
          url: CommonFunctionsUtil.removeSpecialChar(pln.title.toString().toLowerCase(), '-'),
          active: Number(pln.active) === 1,
          createdAt: pln.created_at,
          createdBy: Number(pln.created_by),
          updatedAt: pln.updated_at,
          modifiedBy: Number(pln.modified_by),
          createdIp: ':0',
          modifiedIp: ':0',
        });
      }

      await this.sequelize.query(`truncate table txn_blogs restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < insertList.length; i++) {
        tempList.push(insertList[i]);
        if (tempList.length === 100) {
          await this.blogRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.blogRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_blogs_blog_id_seq',
                       (SELECT MAX(blog_id) + 1 FROM txn_blogs));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createContactUs() {
    try {
      const insertList = [];
      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/contact_form.json`), 'utf8'));
      for (const pln of tempV1List) {
        insertList.push({
          name: pln.name,
          emailId: pln.email,
          countryCode: '+91',
          contactNumber: pln.phone,
          message: pln.message,
          respondedBy: null,
          respondedMessage: null,
          active: true,
          createdAt: pln.created_at,
          updatedAt: pln.updated_at,
          createdIp: pln.created_ip ? pln.created_ip : ':0',
          modifiedIp: pln.updated_ip ? pln.updated_ip : ':0',
        });
      }

      await this.sequelize.query(`truncate table txn_contact_forms restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < insertList.length; i++) {
        tempList.push(insertList[i]);
        if (tempList.length === 100) {
          await this.contactFormRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.contactFormRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_contact_forms_contact_form_id_seq',
                       (SELECT MAX(contact_form_id) + 1 FROM txn_contact_forms));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createSubscription() {
    try {
      const insertList = [];
      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_subscriber.json`), 'utf8'));
      for (const pln of tempV1List) {
        insertList.push({
          name: pln.name,
          emailId: pln.email_id,
          active: pln.active === '1',
          createdAt: pln.created_at,
          updatedAt: pln.updated_at,
          createdIp: pln.created_ip ? pln.created_ip : ':0',
          modifiedIp: pln.updated_ip ? pln.updated_ip : ':0',
          isSubscribe: pln.is_subscribe,
        });
      }

      await this.sequelize.query(`truncate table txn_subscribers restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < insertList.length; i++) {
        tempList.push(insertList[i]);
        if (tempList.length === 100) {
          await this.subscriberRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.subscriberRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_subscribers_subscriber_id_seq',
                       (SELECT MAX(subscriber_id) + 1 FROM txn_subscribers));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }
}
