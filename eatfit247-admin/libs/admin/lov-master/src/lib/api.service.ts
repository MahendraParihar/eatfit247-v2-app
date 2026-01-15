import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import {
  ITableList,
  IGender,
  IBloodSugar,
  IHealthIssue,
  IEatingHabit,
  ILifestyle,
  IMaritalStatus,
  IReligion,
  ISleepingPattern,
  ITypeOfExercise,
  IUrineOutput,
  IHealthParameter,
  IHealthParameterUnit,
  IDropdownItem,
  ICallType,
  IManageCallType,
  IState,
  ICallPurpose,
  ICallLogStatus,
  IBlogAuthor,
  IBlogCategory,
  IBlogComment,
  IFaqCategory,
  IProgramCategory,
  IRecipeCategory,
  IRecipeCuisine,
  IRecipeType,
  ICountry,
  IIssueCategory,
  IIssueStatus,
  IAddressType,
  IManageAddressType
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class LovMasterApiService extends ApiBaseService {
  private readonly baseEndpoint = '';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Gender
  async getGenderList(params?: any): Promise<ITableList<IGender>> {
    const res = await this.httpService.get<ITableList<IGender>>(
      `${this.baseEndpoint}/gender/list`,
      { params }
    );
    return res.data as ITableList<IGender>;
  }

  async getGenderById(id: number): Promise<IGender> {
    const res = await this.httpService.get<IGender>(
      `${this.baseEndpoint}/gender/manage/${id}`
    );
    return res.data as IGender;
  }

  async createGender(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/gender/manage`,
      data
    );
  }

  async updateGender(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/gender/manage/${id}`,
      data
    );
  }

  async updateGenderStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/gender/update-status/${id}`,
      { active }
    );
  }

  async getGenderDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/gender/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Blood Sugar
  async getBloodSugarList(params?: any): Promise<ITableList<IBloodSugar>> {
    const res = await this.httpService.get<ITableList<IBloodSugar>>(
      `${this.baseEndpoint}/blood-sugar/list`,
      { params }
    );
    return res.data as ITableList<IBloodSugar>;
  }

  async getBloodSugarById(id: number): Promise<IBloodSugar> {
    const res = await this.httpService.get<IBloodSugar>(
      `${this.baseEndpoint}/blood-sugar/manage/${id}`
    );
    return res.data as IBloodSugar;
  }

  async createBloodSugar(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/blood-sugar/manage`,
      data
    );
  }

  async updateBloodSugar(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/blood-sugar/manage/${id}`,
      data
    );
  }

  async updateBloodSugarStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/blood-sugar/update-status/${id}`,
      { active }
    );
  }

  async getBloodSugarDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/blood-sugar/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Health Issue
  async getHealthIssueList(params?: any): Promise<ITableList<IHealthIssue>> {
    const res = await this.httpService.get<ITableList<IHealthIssue>>(
      `${this.baseEndpoint}/health-issue/list`,
      { params }
    );
    return res.data as ITableList<IHealthIssue>;
  }

  async getHealthIssueById(id: number): Promise<IHealthIssue> {
    const res = await this.httpService.get<IHealthIssue>(
      `${this.baseEndpoint}/health-issue/manage/${id}`
    );
    return res.data as IHealthIssue;
  }

  async createHealthIssue(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/health-issue/manage`,
      data
    );
  }

  async updateHealthIssue(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/health-issue/manage/${id}`,
      data
    );
  }

  async updateHealthIssueStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/health-issue/update-status/${id}`,
      { active }
    );
  }

  async getHealthIssueDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/health-issue/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Eating Habit
  async getEatingHabitList(params?: any): Promise<ITableList<IEatingHabit>> {
    const res = await this.httpService.get<ITableList<IEatingHabit>>(
      `${this.baseEndpoint}/eating-habit/list`,
      { params }
    );
    return res.data as ITableList<IEatingHabit>;
  }

  async getEatingHabitById(id: number): Promise<IEatingHabit> {
    const res = await this.httpService.get<IEatingHabit>(
      `${this.baseEndpoint}/eating-habit/manage/${id}`
    );
    return res.data as IEatingHabit;
  }

  async createEatingHabit(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/eating-habit/manage`,
      data
    );
  }

  async updateEatingHabit(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/eating-habit/manage/${id}`,
      data
    );
  }

  async updateEatingHabitStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/eating-habit/update-status/${id}`,
      { active }
    );
  }

  async getEatingHabitDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/eating-habit/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Lifestyle
  async getLifestyleList(params?: any): Promise<ITableList<ILifestyle>> {
    const res = await this.httpService.get<ITableList<ILifestyle>>(
      `${this.baseEndpoint}/lifestyle/list`,
      { params }
    );
    return res.data as ITableList<ILifestyle>;
  }

  async getLifestyleById(id: number): Promise<ILifestyle> {
    const res = await this.httpService.get<ILifestyle>(
      `${this.baseEndpoint}/lifestyle/manage/${id}`
    );
    return res.data as ILifestyle;
  }

  async createLifestyle(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/lifestyle/manage`,
      data
    );
  }

  async updateLifestyle(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/lifestyle/manage/${id}`,
      data
    );
  }

  async updateLifestyleStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/lifestyle/update-status/${id}`,
      { active }
    );
  }

  async getLifestyleDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/lifestyle/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Marital Status
  async getMaritalStatusList(
    params?: any
  ): Promise<ITableList<IMaritalStatus>> {
    const res = await this.httpService.get<ITableList<IMaritalStatus>>(
      `${this.baseEndpoint}/marital-status/list`,
      { params }
    );
    return res.data as ITableList<IMaritalStatus>;
  }

  async getMaritalStatusById(id: number): Promise<IMaritalStatus> {
    const res = await this.httpService.get<IMaritalStatus>(
      `${this.baseEndpoint}/marital-status/manage/${id}`
    );
    return res.data as IMaritalStatus;
  }

  async createMaritalStatus(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/marital-status/manage`,
      data
    );
  }

  async updateMaritalStatus(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/marital-status/manage/${id}`,
      data
    );
  }

  async updateMaritalStatusStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/marital-status/update-status/${id}`,
      { active }
    );
  }

  async getMaritalStatusDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/marital-status/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Religion
  async getReligionList(params?: any): Promise<ITableList<IReligion>> {
    const res = await this.httpService.get<ITableList<IReligion>>(
      `${this.baseEndpoint}/religion/list`,
      { params }
    );
    return res.data as ITableList<IReligion>;
  }

  async getReligionById(id: number): Promise<IReligion> {
    const res = await this.httpService.get<IReligion>(
      `${this.baseEndpoint}/religion/manage/${id}`
    );
    return res.data as IReligion;
  }

  async createReligion(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/religion/manage`,
      data
    );
  }

  async updateReligion(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/religion/manage/${id}`,
      data
    );
  }

  async updateReligionStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/religion/update-status/${id}`,
      { active }
    );
  }

  async getReligionDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/religion/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Sleeping Pattern
  async getSleepingPatternList(
    params?: any
  ): Promise<ITableList<ISleepingPattern>> {
    const res = await this.httpService.get<ITableList<ISleepingPattern>>(
      `${this.baseEndpoint}/sleeping-pattern/list`,
      { params }
    );
    return res.data as ITableList<ISleepingPattern>;
  }

  async getSleepingPatternById(id: number): Promise<ISleepingPattern> {
    const res = await this.httpService.get<ISleepingPattern>(
      `${this.baseEndpoint}/sleeping-pattern/manage/${id}`
    );
    return res.data as ISleepingPattern;
  }

  async createSleepingPattern(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/sleeping-pattern/manage`,
      data
    );
  }

  async updateSleepingPattern(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/sleeping-pattern/manage/${id}`,
      data
    );
  }

  async updateSleepingPatternStatus(
    id: number,
    active: boolean
  ): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/sleeping-pattern/update-status/${id}`,
      { active }
    );
  }

  async getSleepingPatternDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/sleeping-pattern/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Type of Exercise
  async getTypeOfExerciseList(
    params?: any
  ): Promise<ITableList<ITypeOfExercise>> {
    const res = await this.httpService.get<ITableList<ITypeOfExercise>>(
      `${this.baseEndpoint}/type-of-exercise/list`,
      { params }
    );
    return res.data as ITableList<ITypeOfExercise>;
  }

  async getTypeOfExerciseById(id: number): Promise<ITypeOfExercise> {
    const res = await this.httpService.get<ITypeOfExercise>(
      `${this.baseEndpoint}/type-of-exercise/manage/${id}`
    );
    return res.data as ITypeOfExercise;
  }

  async createTypeOfExercise(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/type-of-exercise/manage`,
      data
    );
  }

  async updateTypeOfExercise(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/type-of-exercise/manage/${id}`,
      data
    );
  }

  async updateTypeOfExerciseStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/type-of-exercise/update-status/${id}`,
      { active }
    );
  }

  async getTypeOfExerciseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/type-of-exercise/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Urine Output
  async getUrineOutputList(params?: any): Promise<ITableList<IUrineOutput>> {
    const res = await this.httpService.get<ITableList<IUrineOutput>>(
      `${this.baseEndpoint}/urine-output/list`,
      { params }
    );
    return res.data as ITableList<IUrineOutput>;
  }

  async getUrineOutputById(id: number): Promise<IUrineOutput> {
    const res = await this.httpService.get<IUrineOutput>(
      `${this.baseEndpoint}/urine-output/manage/${id}`
    );
    return res.data as IUrineOutput;
  }

  async createUrineOutput(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/urine-output/manage`,
      data
    );
  }

  async updateUrineOutput(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/urine-output/manage/${id}`,
      data
    );
  }

  async updateUrineOutputStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/urine-output/update-status/${id}`,
      { active }
    );
  }

  async getUrineOutputDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/urine-output/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Health Parameter
  async getHealthParameterList(
    params?: any
  ): Promise<ITableList<IHealthParameter>> {
    const res = await this.httpService.get<ITableList<IHealthParameter>>(
      `${this.baseEndpoint}/health-parameter/list`,
      { params }
    );
    return res.data as ITableList<IHealthParameter>;
  }

  async getHealthParameterById(id: number): Promise<IHealthParameter> {
    const res = await this.httpService.get<IHealthParameter>(
      `${this.baseEndpoint}/health-parameter/manage/${id}`
    );
    return res.data as IHealthParameter;
  }

  async createHealthParameter(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/health-parameter/manage`,
      data
    );
  }

  async updateHealthParameter(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/health-parameter/manage/${id}`,
      data
    );
  }

  async updateHealthParameterStatus(
    id: number,
    active: boolean
  ): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/health-parameter/update-status/${id}`,
      { active }
    );
  }

  async getHealthParameterDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/health-parameter/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Health Parameter Unit
  async getHealthParameterUnitList(params?: any): Promise<ITableList<IHealthParameterUnit>> {
    const res = await this.httpService.get<ITableList<IHealthParameterUnit>>(
      `${this.baseEndpoint}/health-parameter-unit/list`,
      { params }
    );
    return res.data as ITableList<IHealthParameterUnit>;
  }

  async getHealthParameterUnitById(id: number): Promise<IHealthParameterUnit> {
    const res = await this.httpService.get<IHealthParameterUnit>(
      `${this.baseEndpoint}/health-parameter-unit/manage/${id}`
    );
    return res.data as IHealthParameterUnit;
  }

  async createHealthParameterUnit(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/health-parameter-unit/manage`,
      data
    );
  }

  async updateHealthParameterUnit(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/health-parameter-unit/manage/${id}`,
      data
    );
  }

  async updateHealthParameterUnitStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/health-parameter-unit/update-status/${id}`,
      { active }
    );
  }

  async getHealthParameterUnitDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/health-parameter-unit/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Call Purpose
  async getCallPurposeList(params?: any): Promise<ITableList<ICallPurpose>> {
    const res = await this.httpService.get<ITableList<ICallPurpose>>(
      `${this.baseEndpoint}/call-purpose/list`,
      { params }
    );
    return res.data as ITableList<ICallPurpose>;
  }

  async getCallPurposeById(id: number): Promise<ICallPurpose> {
    const res = await this.httpService.get<ICallPurpose>(
      `${this.baseEndpoint}/call-purpose/manage/${id}`
    );
    return res.data as ICallPurpose;
  }

  async createCallPurpose(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/call-purpose/manage`,
      data
    );
  }

  async updateCallPurpose(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/call-purpose/manage/${id}`,
      data
    );
  }

  async updateCallPurposeStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/call-purpose/update-status/${id}`,
      { active }
    );
  }

  // Call Log Status
  async getCallLogStatusList(params?: any): Promise<ITableList<ICallLogStatus>> {
    const res = await this.httpService.get<ITableList<ICallLogStatus>>(
      `${this.baseEndpoint}/call-log-status/list`,
      { params }
    );
    return res.data as ITableList<ICallLogStatus>;
  }

  async getCallLogStatusById(id: number): Promise<ICallLogStatus> {
    const res = await this.httpService.get<ICallLogStatus>(
      `${this.baseEndpoint}/call-log-status/manage/${id}`
    );
    return res.data as ICallLogStatus;
  }

  async createCallLogStatus(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/call-log-status/manage`,
      data
    );
  }

  async updateCallLogStatus(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/call-log-status/manage/${id}`,
      data
    );
  }

  async updateCallLogStatusStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/call-log-status/update-status/${id}`,
      { active }
    );
  }

  // Call Type
  async getCallTypeList(params?: any): Promise<ITableList<ICallType>> {
    const res = await this.httpService.get<ITableList<ICallType>>(
      `${this.baseEndpoint}/call-type/list`,
      { params }
    );
    return res.data as ITableList<ICallType>;
  }

  async getCallTypeById(id: number): Promise<ICallType> {
    const res = await this.httpService.get<ICallType>(
      `${this.baseEndpoint}/call-type/manage/${id}`
    );
    return res.data as ICallType;
  }

  async createCallType(data: IManageCallType): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/call-type/manage`,
      data
    );
  }

  async updateCallType(id: number, data: IManageCallType): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/call-type/manage/${id}`,
      data
    );
  }

  async updateCallTypeStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/call-type/update-status/${id}`,
      { active }
    );
  }

  // Blog Author
  async getBlogAuthorList(params?: any): Promise<ITableList<IBlogAuthor>> {
    const res = await this.httpService.get<ITableList<IBlogAuthor>>(
      `${this.baseEndpoint}/blog-author/list`,
      { params }
    );
    return res.data as ITableList<IBlogAuthor>;
  }

  async getBlogAuthorById(id: number): Promise<IBlogAuthor> {
    const res = await this.httpService.get<IBlogAuthor>(
      `${this.baseEndpoint}/blog-author/manage/${id}`
    );
    return res.data as IBlogAuthor;
  }

  async createBlogAuthor(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/blog-author/manage`,
      data
    );
  }

  async updateBlogAuthor(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/blog-author/manage/${id}`,
      data
    );
  }

  async updateBlogAuthorStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/blog-author/update-status/${id}`,
      { active }
    );
  }

  // Blog Category
  async getBlogCategoryList(params?: any): Promise<ITableList<IBlogCategory>> {
    const res = await this.httpService.get<ITableList<IBlogCategory>>(
      `${this.baseEndpoint}/blog-category/list`,
      { params }
    );
    return res.data as ITableList<IBlogCategory>;
  }

  async getBlogCategoryById(id: number): Promise<IBlogCategory> {
    const res = await this.httpService.get<IBlogCategory>(
      `${this.baseEndpoint}/blog-category/manage/${id}`
    );
    return res.data as IBlogCategory;
  }

  async createBlogCategory(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/blog-category/manage`,
      data
    );
  }

  async updateBlogCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/blog-category/manage/${id}`,
      data
    );
  }

  async updateBlogCategoryStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/blog-category/update-status/${id}`,
      { active }
    );
  }

  // Blog Comments
  async getBlogCommentsList(params?: any): Promise<ITableList<IBlogComment>> {
    const res = await this.httpService.get<ITableList<IBlogComment>>(
      `${this.baseEndpoint}/blog-comments/list`,
      { params }
    );
    return res.data as ITableList<IBlogComment>;
  }

  async getBlogCommentsById(id: number): Promise<IBlogComment> {
    const res = await this.httpService.get<IBlogComment>(
      `${this.baseEndpoint}/blog-comments/manage/${id}`
    );
    return res.data as IBlogComment;
  }

  async createBlogComments(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/blog-comments/manage`,
      data
    );
  }

  async updateBlogComments(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/blog-comments/manage/${id}`,
      data
    );
  }

  async updateBlogCommentsStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/blog-comments/update-status/${id}`,
      { active }
    );
  }

  // FAQ Category
  async getFaqCategoryList(params?: any): Promise<ITableList<IFaqCategory>> {
    const res = await this.httpService.get<ITableList<IFaqCategory>>(
      `${this.baseEndpoint}/faq-category/list`,
      { params }
    );
    return res.data as ITableList<IFaqCategory>;
  }

  async getFaqCategoryById(id: number): Promise<IFaqCategory> {
    const res = await this.httpService.get<IFaqCategory>(
      `${this.baseEndpoint}/faq-category/manage/${id}`
    );
    return res.data as IFaqCategory;
  }

  async createFaqCategory(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/faq-category/manage`,
      data
    );
  }

  async updateFaqCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/faq-category/manage/${id}`,
      data
    );
  }

  async updateFaqCategoryStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/faq-category/update-status/${id}`,
      { active }
    );
  }

  // Issue Category
  async getIssueCategoryList(params?: any): Promise<ITableList<IIssueCategory>> {
    const res = await this.httpService.get<ITableList<IIssueCategory>>(
      `${this.baseEndpoint}/issue-category/list`,
      { params }
    );
    return res.data as ITableList<IIssueCategory>;
  }

  async getIssueCategoryById(id: number): Promise<IIssueCategory> {
    const res = await this.httpService.get<IIssueCategory>(
      `${this.baseEndpoint}/issue-category/manage/${id}`
    );
    return res.data as IIssueCategory;
  }

  async createIssueCategory(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/issue-category/manage`,
      data
    );
  }

  async updateIssueCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/issue-category/manage/${id}`,
      data
    );
  }

  async updateIssueCategoryStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/issue-category/update-status/${id}`,
      { active }
    );
  }

  async getIssueCategoryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/issue-category/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Issue Status
  async getIssueStatusList(params?: any): Promise<ITableList<IIssueStatus>> {
    const res = await this.httpService.get<ITableList<IIssueStatus>>(
      `${this.baseEndpoint}/issue-status/list`,
      { params }
    );
    return res.data as ITableList<IIssueStatus>;
  }

  async getIssueStatusById(id: number): Promise<IIssueStatus> {
    const res = await this.httpService.get<IIssueStatus>(
      `${this.baseEndpoint}/issue-status/manage/${id}`
    );
    return res.data as IIssueStatus;
  }

  async createIssueStatus(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/issue-status/manage`,
      data
    );
  }

  async updateIssueStatus(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/issue-status/manage/${id}`,
      data
    );
  }

  async updateIssueStatusStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/issue-status/update-status/${id}`,
      { active }
    );
  }

  async getIssueStatusDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/issue-status/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // Program Category
  async getProgramCategoryList(params?: any): Promise<ITableList<IProgramCategory>> {
    const res = await this.httpService.get<ITableList<IProgramCategory>>(
      `${this.baseEndpoint}/program-category/list`,
      { params }
    );
    return res.data as ITableList<IProgramCategory>;
  }

  async getProgramCategoryById(id: number): Promise<IProgramCategory> {
    const res = await this.httpService.get<IProgramCategory>(
      `${this.baseEndpoint}/program-category/manage/${id}`
    );
    return res.data as IProgramCategory;
  }

  async createProgramCategory(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/program-category/manage`,
      data
    );
  }

  async updateProgramCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/program-category/manage/${id}`,
      data
    );
  }

  async updateProgramCategoryStatus(
    id: number,
    active: boolean
  ): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/program-category/update-status/${id}`,
      { active }
    );
  }

  // Recipe Category
  async getRecipeCategoryList(params?: any): Promise<ITableList<IRecipeCategory>> {
    const res = await this.httpService.get<ITableList<IRecipeCategory>>(
      `${this.baseEndpoint}/recipe-category/list`,
      { params }
    );
    return res.data as ITableList<IRecipeCategory>;
  }

  async getRecipeCategoryById(id: number): Promise<IRecipeCategory> {
    const res = await this.httpService.get<IRecipeCategory>(
      `${this.baseEndpoint}/recipe-category/manage/${id}`
    );
    return res.data as IRecipeCategory;
  }

  async createRecipeCategory(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/recipe-category/manage`,
      data
    );
  }

  async updateRecipeCategory(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/recipe-category/manage/${id}`,
      data
    );
  }

  async updateRecipeCategoryStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/recipe-category/update-status/${id}`,
      { active }
    );
  }

  // Recipe Cuisine
  async getRecipeCuisineList(params?: any): Promise<ITableList<IRecipeCuisine>> {
    const res = await this.httpService.get<ITableList<IRecipeCuisine>>(
      `${this.baseEndpoint}/recipe-cuisine/list`,
      { params }
    );
    return res.data as ITableList<IRecipeCuisine>;
  }

  async getRecipeCuisineById(id: number): Promise<IRecipeCuisine> {
    const res = await this.httpService.get<IRecipeCuisine>(
      `${this.baseEndpoint}/recipe-cuisine/manage/${id}`
    );
    return res.data as IRecipeCuisine;
  }

  async createRecipeCuisine(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/recipe-cuisine/manage`,
      data
    );
  }

  async updateRecipeCuisine(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/recipe-cuisine/manage/${id}`,
      data
    );
  }

  async updateRecipeCuisineStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/recipe-cuisine/update-status/${id}`,
      { active }
    );
  }

  // Recipe Type
  async getRecipeTypeList(params?: any): Promise<ITableList<IRecipeType>> {
    const res = await this.httpService.get<ITableList<IRecipeType>>(
      `${this.baseEndpoint}/recipe-type/list`,
      { params }
    );
    return res.data as ITableList<IRecipeType>;
  }

  async getRecipeTypeById(id: number): Promise<IRecipeType> {
    const res = await this.httpService.get<IRecipeType>(
      `${this.baseEndpoint}/recipe-type/manage/${id}`
    );
    return res.data as IRecipeType;
  }

  async createRecipeType(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/recipe-type/manage`,
      data
    );
  }

  async updateRecipeType(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/recipe-type/manage/${id}`,
      data
    );
  }

  async updateRecipeTypeStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/recipe-type/update-status/${id}`,
      { active }
    );
  }

  // Country
  async getCountryList(params?: any): Promise<ITableList<ICountry>> {
    const res = await this.httpService.get<ITableList<ICountry>>(
      `${this.baseEndpoint}/country/list`,
      { params }
    );
    return res.data as ITableList<ICountry>;
  }

  async getCountryById(id: number): Promise<ICountry> {
    const res = await this.httpService.get<ICountry>(
      `${this.baseEndpoint}/country/manage/${id}`
    );
    return res.data as ICountry;
  }

  async createCountry(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/country/manage`,
      data
    );
  }

  async updateCountry(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/country/manage/${id}`,
      data
    );
  }

  async updateCountryStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/country/update-status/${id}`,
      { active }
    );
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/country/dropdown`
    );
    return res.data as IDropdownItem[];
  }

  // State
  async getStateList(params?: any): Promise<ITableList<IState>> {
    const res = await this.httpService.get<ITableList<IState>>(
      `${this.baseEndpoint}/state/list`,
      { params }
    );
    return res.data as ITableList<IState>;
  }

  async getStateById(id: number): Promise<IState> {
    const res = await this.httpService.get<IState>(
      `${this.baseEndpoint}/state/manage/${id}`
    );
    return res.data as IState;
  }

  async createState(data: any): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/state/manage`,
      data
    );
  }

  async updateState(id: number, data: any): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/state/manage/${id}`,
      data
    );
  }

  async updateStateStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/state/update-status/${id}`,
      { active }
    );
  }

  async getStateDropdown(countryId?: number): Promise<IDropdownItem[]> {
    const params = countryId ? { countryId } : {};
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/state/dropdown`,
      { params }
    );
    return res.data as IDropdownItem[];
  }

  // Address Type
  async getAddressTypeList(params?: any): Promise<ITableList<IAddressType>> {
    const res = await this.httpService.get<ITableList<IAddressType>>(
      `${this.baseEndpoint}/address-type/list`,
      { params }
    );
    return res.data as ITableList<IAddressType>;
  }

  async getAddressTypeById(id: number): Promise<IAddressType> {
    const res = await this.httpService.get<IAddressType>(
      `${this.baseEndpoint}/address-type/manage/${id}`
    );
    return res.data as IAddressType;
  }

  async createAddressType(data: IManageAddressType): Promise<void> {
    await this.httpService.post<void>(
      `${this.baseEndpoint}/address-type/manage`,
      data
    );
  }

  async updateAddressType(id: number, data: IManageAddressType): Promise<void> {
    await this.httpService.put<void>(
      `${this.baseEndpoint}/address-type/manage/${id}`,
      data
    );
  }

  async updateAddressTypeStatus(id: number, active: boolean): Promise<void> {
    await this.httpService.patch<void>(
      `${this.baseEndpoint}/address-type/update-status/${id}`,
      { active }
    );
  }

  async getAddressTypeDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      `${this.baseEndpoint}/address-type/dropdown`
    );
    return res.data as IDropdownItem[];
  }
}

