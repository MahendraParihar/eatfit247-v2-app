import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { MstRecipe, MstRecipeCategoryMapping, MstRecipeCuisineMapping, MstRecipeType } from '../models';
import { IBasicSearch, IManageRecipe, IRecipe, ITableList, MediaForEnum, TEMPLATE_FOLDER } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, Env, SearchUtil } from '@server_1/core';
import {
  IFileModel,
  PDF_HEADER_H_PADDING_DIET_RECIPE,
  PDF_PAGE_MARGIN_H_DIET_RECIPE,
} from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';

@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    @InjectModel(MstRecipeCategoryMapping) private readonly recipeCategoryMappingRepository: typeof MstRecipeCategoryMapping,
    @InjectModel(MstRecipeCuisineMapping) private readonly recipeCuisineMappingRepository: typeof MstRecipeCuisineMapping,
    private franchiseService: FranchiseService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipe>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.recipeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IRecipe[] = rows.map((item: any) => {return this.convertToModel(item.get({ plain: true }));});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipe {
    const categories = [];
    const cuisines = [];
    if (item.recipeCategoryMappings && item.recipeCategoryMappings.length > 0) {
      item.recipeCategoryMappings.forEach((rcm: MstRecipeCategoryMapping) => {
        categories.push({
          recipeCategoryId: rcm.recipeCategoryId,
          recipeId: rcm.recipeId,
          recipeCategory: rcm.recipeCategory.recipeCategory,
        });
      });
    }
    if (item.recipeCuisineMappings && item.recipeCuisineMappings.length > 0) {
      item.recipeCuisineMappings.forEach((rcm: MstRecipeCuisineMapping) => {
        cuisines.push({
          recipeCuisineId: rcm.recipeCuisineId,
          recipeId: rcm.recipeId,
          recipeCuisine: rcm.recipeCuisine.recipeCuisine,
        });
      });
    }
    return <IRecipe>{
      recipeId: item.recipeId,
      id: item.recipeId,
      name: item.name,
      recipeTypeId: item.recipeTypeId,
      recipeType: item.recipeType?.recipeType || '',
      details: item.details,
      howToMake: item.howToMake,
      ingredient: item.ingredient,
      benefits: item.benefits,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      servingCount: item.servingCount,
      downloadPath: item.downloadPath,
      seo: {
        url: item.url,
      },
      visitedCount: item.visitedCount,
      shareCount: item.shareCount,
      isVisibleToAll: item.isVisibleToAll,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      recipeCategoryMappings: categories,
      recipeCuisineMappings: cuisines,
    };
  }

  public async fetchById(id: number): Promise<IRecipe> {
    const find = await this.recipeRepository.scope('details').findOne({
      where: { recipeId: id },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    return this.convertToModel(find.get({ plain: true }));
  }

  public async create(obj: IManageRecipe, cIp: string, adminId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const createObj = {
        name: obj.name,
        recipeTypeId: obj.recipeTypeId,
        details: obj.details || null,
        ingredient: obj.ingredient || null,
        howToMake: obj.howToMake || null,
        benefits: obj.benefits || null,
        imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
        servingCount: obj.servingCount,
        downloadPath: obj.downloadPath || null,
        url: CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
        visitedCount: 0,
        shareCount: 0,
        isVisibleToAll: obj.isVisibleToAll,
        active: obj.active,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const recipe = await this.recipeRepository.create(createObj, { transaction });
      const recipeId = recipe.recipeId;

      // Create recipe category mappings
      if (obj.recipeCategoryIds && obj.recipeCategoryIds.length > 0) {
        const categoryMappings = obj.recipeCategoryIds.map((categoryId) => ({
          recipeId: recipeId,
          recipeCategoryId: categoryId,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.recipeCategoryMappingRepository.bulkCreate(categoryMappings, { transaction });
      }

      // Create recipe cuisine mappings
      if (obj.recipeCuisineIds && obj.recipeCuisineIds.length > 0) {
        const cuisineMappings = obj.recipeCuisineIds.map((cuisineId) => ({
          recipeId: recipeId,
          recipeCuisineId: cuisineId,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.recipeCuisineMappingRepository.bulkCreate(cuisineMappings, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async update(id: number, obj: IManageRecipe, cIp: string, adminId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const find = await this.recipeRepository.findOne({
        where: { recipeId: id },
        transaction,
      });
      if (!find) {
        await transaction.rollback();
        throw new NotFoundException('Recipe not found');
      }
      const updateObj = {
        name: obj.name,
        recipeTypeId: obj.recipeTypeId,
        details: obj.details || null,
        ingredient: obj.ingredient || null,
        howToMake: obj.howToMake || null,
        benefits: obj.benefits || null,
        imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
        servingCount: obj.servingCount,
        downloadPath: obj.downloadPath || null,
        isVisibleToAll: obj.isVisibleToAll,
        active: obj.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.recipeRepository.update(updateObj, { where: { recipeId: id }, transaction });

      // Delete existing category mappings
      await this.recipeCategoryMappingRepository.destroy({
        where: { recipeId: id },
        transaction,
      });

      // Create new recipe category mappings
      if (obj.recipeCategoryIds && obj.recipeCategoryIds.length > 0) {
        const categoryMappings = obj.recipeCategoryIds.map((categoryId) => ({
          recipeId: id,
          recipeCategoryId: categoryId,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.recipeCategoryMappingRepository.bulkCreate(categoryMappings, { transaction });
      }

      // Delete existing cuisine mappings
      await this.recipeCuisineMappingRepository.destroy({
        where: { recipeId: id },
        transaction,
      });

      // Create new recipe cuisine mappings
      if (obj.recipeCuisineIds && obj.recipeCuisineIds.length > 0) {
        const cuisineMappings = obj.recipeCuisineIds.map((cuisineId) => ({
          recipeId: id,
          recipeCuisineId: cuisineId,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.recipeCuisineMappingRepository.bulkCreate(cuisineMappings, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeRepository.findOne({
      where: { recipeId: id },
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.recipeRepository.update(updateObj, { where: { recipeId: id } });
  }

  public async downloadRecipePdf(recipeId: number): Promise<IFileModel> {
    const recipe = await this.recipeRepository.scope('details').findOne({
      where: { recipeId },
      nest: true,
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    const recipeData = recipe.get({ plain: true });
    // Fetch primary franchise for header information
    let franchise = null;
    try {
      const franchiseList = await this.franchiseService.findAll({ page: 0, limit: 100 });
      franchise = franchiseList.tableData.find((f: any) => f.isPrimary) || franchiseList.tableData[0];
    } catch (error) {
      this.logger.warn('Could not fetch franchise information', { error });
    }
    // Parse ingredients into list
    const ingredientText = recipeData.ingredient || '';
    const ingredientList = this.parseTextToList(ingredientText);
    // Parse directions into list (use canonical howToMake field)
    const directionsText = recipeData.howToMake || '';
    const directionsList = this.parseTextToList(directionsText);
    // Process images - convert to base64 if they are local files
    let processedImagePath = recipeData.imagePath || [];
    if (processedImagePath.length > 0) {
      processedImagePath = await Promise.all(
        processedImagePath.map(async (img: any) => {
          if (!img.webUrl) {
            return img;
          }
          // If it's already a data URL or HTTP URL, use it as is
          if (img.webUrl.startsWith('data:') || img.webUrl.startsWith('http://') || img.webUrl.startsWith('https://')) {
            return img;
          }
          // Otherwise, try to convert local file to base64
          try {
            let normalizedPath = img.webUrl.startsWith('media-files/')
              ? img.webUrl.replace('media-files/', '')
              : img.webUrl;
            // Remove leading slash if present
            normalizedPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
            const filePath = path.join(Env.persistentStorageAssetPath, normalizedPath);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const mimeType = img.mimetype || 'image/jpeg';
              return {
                ...img,
                webUrl: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
              };
            }
          } catch (error) {
            this.logger.warn(`Failed to convert image ${img.webUrl} to base64`, { error });
          }
          return img;
        }),
      );
    }
    // Prepare recipe data for PDF template
    const recipeObj = {
      id: recipeData.recipeId,
      name: recipeData.name,
      details: recipeData.details || '',
      howToMake: directionsText,
      ingredient: ingredientText,
      ingredientList: ingredientList,
      directionsList: directionsList,
      imagePath: processedImagePath,
      serving: recipeData.servingCount || 0,
      recipeType: recipeData.recipeType?.recipeType || '',
      franchise: franchise,
    };
    // Generate PDF with optimized margins for single page
    const fileName = `${recipeData.name
      .replace(/[^\w\s]/gi, '')
      .replace(/ /g, '_')}_${recipeId}`;
    return await this.generateRecipePdfWithMargins('recipe', fileName, recipeObj, franchise);
  }

  /**
   * Generate a recipe PDF with optimized margins to fit on one page
   */
  private async generateRecipePdfWithMargins(
    templateName: string,
    fileName: string,
    data: any,
    franchise: any,
  ): Promise<IFileModel> {
    const rPath = `${Env.persistentStorageAssetPath}`;
    const fileNameWithExtension = `${fileName}.pdf`;
    const relativePath = `${MediaForEnum.RECIPE}/${fileNameWithExtension}`;
    const downloadFullPath = `${rPath}/${MediaForEnum.DOWNLOADS}`;
    const physicalFolderPath = `${downloadFullPath}/${MediaForEnum.RECIPE}`;
    const physicalFilePath = `${downloadFullPath}/${relativePath}`;
    // Create directory if not exists
    if (!fs.existsSync(physicalFolderPath)) {
      fs.mkdirSync(physicalFolderPath, { recursive: true });
    }
    // Register header and footer
    const { headerTemplate, footerTemplate } = await this.getHeaderFooter(franchise);
    // Get HTML from the template
    const html = await this.getTemplateHtml(templateName, data);
    // Generate PDF using Puppeteer with optimized margins
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
        margin: {
          top: '100px',
          bottom: '15mm',
          right: PDF_PAGE_MARGIN_H_DIET_RECIPE,
          left: PDF_PAGE_MARGIN_H_DIET_RECIPE,
        },
      });
      fs.writeFileSync(physicalFilePath, pdfBuffer);
      const tempFile = fs.readFileSync(physicalFilePath);
      return {
        filePath: relativePath,
        fileName: fileNameWithExtension,
        buffer: tempFile.toString('base64'),
      } as IFileModel;
    } finally {
      await browser.close();
    }
  }

  /**
   * Get header and footer templates
   */
  private async getHeaderFooter(franchise: any): Promise<{ headerTemplate: string; footerTemplate: string }> {
    // Register Handlebars helpers
    this.registerHbsHelpers();
    // Get header template
    const headerPath = this.findTemplatePath('header.hbs');
    const headerHbsTemplate = fs.readFileSync(headerPath, 'utf-8');
    const headerFooterContext = {
      ...(franchise ?? {}),
      pdfHorizontalPadding: PDF_HEADER_H_PADDING_DIET_RECIPE,
    };
    const headerTemplate = hbs.compile(headerHbsTemplate)(headerFooterContext);
    // Get footer template
    const footerPath = this.findTemplatePath('footer.hbs');
    const footerHbsTemplate = fs.readFileSync(footerPath, 'utf-8');
    const footerTemplate = hbs.compile(footerHbsTemplate)(headerFooterContext);
    return { headerTemplate, footerTemplate };
  }

  /**
   * Get template HTML
   */
  private async getTemplateHtml(templateName: string, data: any): Promise<string> {
    const templatePath = this.findTemplatePath(`${templateName}.hbs`);
    const hbsTemplate = fs.readFileSync(templatePath, 'utf-8');
    this.registerHbsHelpers();
    return hbs.compile(hbsTemplate)(data);
  }

  /**
   * Find template path
   */
  private findTemplatePath(templateName: string): string {
    const distPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}`);
    const cwdPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}`);
    const relativePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      `${TEMPLATE_FOLDER}/${templateName}`,
    );
    if (fs.existsSync(distPath)) {
      return distPath;
    } else if (fs.existsSync(relativePath)) {
      return relativePath;
    } else if (fs.existsSync(cwdPath)) {
      return cwdPath;
    }
    throw new Error(
      `Template not found: ${templateName}. Searched in: ${distPath}, ${cwdPath}, ${relativePath}`,
    );
  }

  /**
   * Register Handlebars helpers
   */
  private registerHbsHelpers(): void {
    // Register img helper
    if (!hbs.helpers['img']) {
      hbs.registerHelper('img', function(url: string, cssClass: string) {
        try {
          const imagePath = path.join(process.cwd(), url);
          if (fs.existsSync(imagePath)) {
            const fileBuffer = fs.readFileSync(imagePath);
            const base64 = fileBuffer.toString('base64');
            const mimeType = url.endsWith('.png') ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            return new hbs.SafeString(`<img class="${cssClass}" src="${dataUrl}" alt="" />`);
          }
        } catch (e) {
          // Ignore errors
        }
        return new hbs.SafeString('');
      });
    }
    // Register other helpers if not already registered
    if (!hbs.helpers['eq']) {
      hbs.registerHelper('eq', (a: any, b: any) => a === b);
    }
    if (!hbs.helpers['gt']) {
      hbs.registerHelper('gt', (a: number, b: number) => (a || 0) > (b || 0));
    }
    if (!hbs.helpers['length']) {
      hbs.registerHelper('length', (arr: any[]) => (arr ? arr.length : 0));
    }
    if (!hbs.helpers['splitDirections']) {
      hbs.registerHelper('splitDirections', (text: string) => {
        if (!text || text.trim() === '') return [];
        const cleanText = text
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<p[^>]*>/gi, '')
          .replace(/<li[^>]*>/gi, '')
          .replace(/<\/li>/gi, '\n')
          .replace(/<ol[^>]*>/gi, '')
          .replace(/<\/ol>/gi, '')
          .replace(/<ul[^>]*>/gi, '')
          .replace(/<\/ul>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        const items = cleanText
          .split(/\n+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        return items.length > 0 ? items : [text.trim()];
      });
    }
  }

  /**
   * Parses text (HTML or plain text) into a list of items
   * Handles HTML lists, numbered lists, and plain text with line breaks
   */
  private parseTextToList(text: string): string[] {
    if (!text || text.trim() === '') {
      return [];
    }
    // Remove HTML tags but preserve line breaks
    let cleanText = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<li[^>]*>/gi, '')
      .replace(/<\/li>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
      .trim();
    // Split by newlines and filter out empty lines
    const items = cleanText
      .split(/\n+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    // If no items found, return the original text as a single item
    if (items.length === 0) {
      return [text.trim()];
    }
    return items;
  }

  /**
   * Lightweight search for dropdown options
   * Searches only on recipe name and recipe type
   * Returns minimal data: id, title (recipe name), subtitle (recipe type)
   */
  public async searchForDropdown(searchDto: IBasicSearch): Promise<Array<{
    id: number;
    title: string;
    subtitle: string
  }>> {
    const whereCondition: any = {
      active: true, // Only return active recipes
    };
    // Build search condition for recipe name and recipe type
    const searchTerm = searchDto.search || searchDto.name;
    if (searchTerm) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { '$recipeType.recipe_type$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 10;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows } = await this.recipeRepository.findAndCountAll({
      attributes: ['recipeId', 'name'],
      include: [
        {
          model: MstRecipeType,
          as: 'recipeType',
          required: false,
          attributes: ['recipeType'],
        },
      ],
      where: whereCondition,
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
      raw: false,
    });
    return rows.map((item: any) => {
      const plain = item.get({ plain: true });
      return {
        id: plain.recipeId,
        title: plain.name,
        subtitle: plain.recipeType?.recipeType || '',
      };
    });
  }
}

