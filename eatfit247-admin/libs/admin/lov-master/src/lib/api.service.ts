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
  IDropdownItem, ICallType, IResponse, IManageCallType
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
    return await this.httpService.get<ITableList<IGender>>(`${this.baseEndpoint}/gender/list`, { params });
  }

  async getGenderById(id: number): Promise<IGender> {
    return await this.httpService.get<IGender>(`${this.baseEndpoint}/gender/manage/${id}`);
  }

  async createGender(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/gender/manage`, data);
  }

  async updateGender(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/gender/manage/${id}`, data);
  }

  async updateGenderStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/gender/update-status/${id}`, { active });
  }

  async getGenderDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/gender/dropdown`);
  }

  // Blood Sugar
  async getBloodSugarList(params?: any): Promise<ITableList<IBloodSugar>> {
    return await this.httpService.get<ITableList<IBloodSugar>>(`${this.baseEndpoint}/blood-sugar/list`, { params });
  }

  async getBloodSugarById(id: number): Promise<IBloodSugar> {
    return await this.httpService.get<IBloodSugar>(`${this.baseEndpoint}/blood-sugar/manage/${id}`);
  }

  async createBloodSugar(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/blood-sugar/manage`, data);
  }

  async updateBloodSugar(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/blood-sugar/manage/${id}`, data);
  }

  async updateBloodSugarStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/blood-sugar/update-status/${id}`, { active });
  }

  async getBloodSugarDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/blood-sugar/dropdown`);
  }

  // Health Issue
  async getHealthIssueList(params?: any): Promise<ITableList<IHealthIssue>> {
    return await this.httpService.get<ITableList<IHealthIssue>>(`${this.baseEndpoint}/health-issue/list`, { params });
  }

  async getHealthIssueById(id: number): Promise<IHealthIssue> {
    return await this.httpService.get<IHealthIssue>(`${this.baseEndpoint}/health-issue/manage/${id}`);
  }

  async createHealthIssue(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/health-issue/manage`, data);
  }

  async updateHealthIssue(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/health-issue/manage/${id}`, data);
  }

  async updateHealthIssueStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/health-issue/update-status/${id}`, { active });
  }

  async getHealthIssueDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/health-issue/dropdown`);
  }

  // Eating Habit
  async getEatingHabitList(params?: any): Promise<ITableList<IEatingHabit>> {
    return await this.httpService.get<ITableList<IEatingHabit>>(`${this.baseEndpoint}/eating-habit/list`, { params });
  }

  async getEatingHabitById(id: number): Promise<IEatingHabit> {
    return await this.httpService.get<IEatingHabit>(`${this.baseEndpoint}/eating-habit/manage/${id}`);
  }

  async createEatingHabit(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/eating-habit/manage`, data);
  }

  async updateEatingHabit(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/eating-habit/manage/${id}`, data);
  }

  async updateEatingHabitStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/eating-habit/update-status/${id}`, { active });
  }

  async getEatingHabitDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/eating-habit/dropdown`);
  }

  // Lifestyle
  async getLifestyleList(params?: any): Promise<ITableList<ILifestyle>> {
    return await this.httpService.get<ITableList<ILifestyle>>(`${this.baseEndpoint}/lifestyle/list`, { params });
  }

  async getLifestyleById(id: number): Promise<ILifestyle> {
    return await this.httpService.get<ILifestyle>(`${this.baseEndpoint}/lifestyle/manage/${id}`);
  }

  async createLifestyle(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/lifestyle/manage`, data);
  }

  async updateLifestyle(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/lifestyle/manage/${id}`, data);
  }

  async updateLifestyleStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/lifestyle/update-status/${id}`, { active });
  }

  async getLifestyleDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/lifestyle/dropdown`);
  }

  // Marital Status
  async getMaritalStatusList(params?: any): Promise<ITableList<IMaritalStatus>> {
    return await this.httpService.get<ITableList<IMaritalStatus>>(`${this.baseEndpoint}/marital-status/list`, { params });
  }

  async getMaritalStatusById(id: number): Promise<IMaritalStatus> {
    return await this.httpService.get<IMaritalStatus>(`${this.baseEndpoint}/marital-status/manage/${id}`);
  }

  async createMaritalStatus(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/marital-status/manage`, data);
  }

  async updateMaritalStatus(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/marital-status/manage/${id}`, data);
  }

  async updateMaritalStatusStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/marital-status/update-status/${id}`, { active });
  }

  async getMaritalStatusDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/marital-status/dropdown`);
  }

  // Religion
  async getReligionList(params?: any): Promise<ITableList<IReligion>> {
    return await this.httpService.get<ITableList<IReligion>>(`${this.baseEndpoint}/religion/list`, { params });
  }

  async getReligionById(id: number): Promise<IReligion> {
    return await this.httpService.get<IReligion>(`${this.baseEndpoint}/religion/manage/${id}`);
  }

  async createReligion(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/religion/manage`, data);
  }

  async updateReligion(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/religion/manage/${id}`, data);
  }

  async updateReligionStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/religion/update-status/${id}`, { active });
  }

  async getReligionDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/religion/dropdown`);
  }

  // Sleeping Pattern
  async getSleepingPatternList(params?: any): Promise<ITableList<ISleepingPattern>> {
    return await this.httpService.get<ITableList<ISleepingPattern>>(`${this.baseEndpoint}/sleeping-pattern/list`, { params });
  }

  async getSleepingPatternById(id: number): Promise<ISleepingPattern> {
    return await this.httpService.get<ISleepingPattern>(`${this.baseEndpoint}/sleeping-pattern/manage/${id}`);
  }

  async createSleepingPattern(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/sleeping-pattern/manage`, data);
  }

  async updateSleepingPattern(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/sleeping-pattern/manage/${id}`, data);
  }

  async updateSleepingPatternStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/sleeping-pattern/update-status/${id}`, { active });
  }

  async getSleepingPatternDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/sleeping-pattern/dropdown`);
  }

  // Type of Exercise
  async getTypeOfExerciseList(params?: any): Promise<ITableList<ITypeOfExercise>> {
    return await this.httpService.get<ITableList<ITypeOfExercise>>(`${this.baseEndpoint}/type-of-exercise/list`, { params });
  }

  async getTypeOfExerciseById(id: number): Promise<ITypeOfExercise> {
    return await this.httpService.get<ITypeOfExercise>(`${this.baseEndpoint}/type-of-exercise/manage/${id}`);
  }

  async createTypeOfExercise(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/type-of-exercise/manage`, data);
  }

  async updateTypeOfExercise(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/type-of-exercise/manage/${id}`, data);
  }

  async updateTypeOfExerciseStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/type-of-exercise/update-status/${id}`, { active });
  }

  async getTypeOfExerciseDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/type-of-exercise/dropdown`);
  }

  // Urine Output
  async getUrineOutputList(params?: any): Promise<ITableList<IUrineOutput>> {
    return await this.httpService.get<ITableList<IUrineOutput>>(`${this.baseEndpoint}/urine-output/list`, { params });
  }

  async getUrineOutputById(id: number): Promise<IUrineOutput> {
    return await this.httpService.get<IUrineOutput>(`${this.baseEndpoint}/urine-output/manage/${id}`);
  }

  async createUrineOutput(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/urine-output/manage`, data);
  }

  async updateUrineOutput(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/urine-output/manage/${id}`, data);
  }

  async updateUrineOutputStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/urine-output/update-status/${id}`, { active });
  }

  async getUrineOutputDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/urine-output/dropdown`);
  }

  // Health Parameter
  async getHealthParameterList(params?: any): Promise<ITableList<IHealthParameter>> {
    return await this.httpService.get<ITableList<IHealthParameter>>(`${this.baseEndpoint}/health-parameter/list`, { params });
  }

  async getHealthParameterById(id: number): Promise<IHealthParameter> {
    return await this.httpService.get<IHealthParameter>(`${this.baseEndpoint}/health-parameter/manage/${id}`);
  }

  async createHealthParameter(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/health-parameter/manage`, data);
  }

  async updateHealthParameter(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/health-parameter/manage/${id}`, data);
  }

  async updateHealthParameterStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/health-parameter/update-status/${id}`, { active });
  }

  async getHealthParameterDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/health-parameter/dropdown`);
  }

  // Call Purpose
  async getCallPurposeList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/call-purpose/list`, { params });
  }

  async getCallPurposeById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/call-purpose/manage/${id}`);
  }

  async createCallPurpose(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/call-purpose/manage`, data);
  }

  async updateCallPurpose(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/call-purpose/manage/${id}`, data);
  }

  async updateCallPurposeStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/call-purpose/update-status/${id}`, { active });
  }

  // Call Log Status
  async getCallLogStatusList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/call-log-status/list`, { params });
  }

  async getCallLogStatusById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/call-log-status/manage/${id}`);
  }

  async createCallLogStatus(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/call-log-status/manage`, data);
  }

  async updateCallLogStatus(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/call-log-status/manage/${id}`, data);
  }

  async updateCallLogStatusStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/call-log-status/update-status/${id}`, { active });
  }

  // Call Type
  async getCallTypeList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/call-type/list`, { params });
  }

  async getCallTypeById(id: number): Promise<ICallType> {
    const res = await this.httpService.get<IResponse<ICallType>>(`${this.baseEndpoint}/call-type/manage/${id}`);
    return res.data as ICallType;
  }

  async createCallType(data: IManageCallType): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/call-type/manage`, data);
  }

  async updateCallType(id: number, data: IManageCallType): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/call-type/manage/${id}`, data);
  }

  async updateCallTypeStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/call-type/update-status/${id}`, { active });
  }

  // Blog Author
  async getBlogAuthorList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/blog-author/list`, { params });
  }

  async getBlogAuthorById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/blog-author/manage/${id}`);
  }

  async createBlogAuthor(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/blog-author/manage`, data);
  }

  async updateBlogAuthor(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/blog-author/manage/${id}`, data);
  }

  async updateBlogAuthorStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/blog-author/update-status/${id}`, { active });
  }

  // Blog Category
  async getBlogCategoryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/blog-category/list`, { params });
  }

  async getBlogCategoryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/blog-category/manage/${id}`);
  }

  async createBlogCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/blog-category/manage`, data);
  }

  async updateBlogCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/blog-category/manage/${id}`, data);
  }

  async updateBlogCategoryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/blog-category/update-status/${id}`, { active });
  }

  // Blog Comments
  async getBlogCommentsList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/blog-comments/list`, { params });
  }

  async getBlogCommentsById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/blog-comments/manage/${id}`);
  }

  async createBlogComments(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/blog-comments/manage`, data);
  }

  async updateBlogComments(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/blog-comments/manage/${id}`, data);
  }

  async updateBlogCommentsStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/blog-comments/update-status/${id}`, { active });
  }

  // FAQ Category
  async getFaqCategoryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/faq-category/list`, { params });
  }

  async getFaqCategoryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/faq-category/manage/${id}`);
  }

  async createFaqCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/faq-category/manage`, data);
  }

  async updateFaqCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/faq-category/manage/${id}`, data);
  }

  async updateFaqCategoryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/faq-category/update-status/${id}`, { active });
  }

  // Issue Category
  async getIssueCategoryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/issue-category/list`, { params });
  }

  async getIssueCategoryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/issue-category/manage/${id}`);
  }

  async createIssueCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/issue-category/manage`, data);
  }

  async updateIssueCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/issue-category/manage/${id}`, data);
  }

  async updateIssueCategoryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/issue-category/update-status/${id}`, { active });
  }

  // Issue Status
  async getIssueStatusList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/issue-status/list`, { params });
  }

  async getIssueStatusById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/issue-status/manage/${id}`);
  }

  async createIssueStatus(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/issue-status/manage`, data);
  }

  async updateIssueStatus(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/issue-status/manage/${id}`, data);
  }

  async updateIssueStatusStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/issue-status/update-status/${id}`, { active });
  }

  // Program Category
  async getProgramCategoryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/program-category/list`, { params });
  }

  async getProgramCategoryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/program-category/manage/${id}`);
  }

  async createProgramCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/program-category/manage`, data);
  }

  async updateProgramCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/program-category/manage/${id}`, data);
  }

  async updateProgramCategoryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/program-category/update-status/${id}`, { active });
  }

  // Recipe Category
  async getRecipeCategoryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/recipe-category/list`, { params });
  }

  async getRecipeCategoryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/recipe-category/manage/${id}`);
  }

  async createRecipeCategory(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/recipe-category/manage`, data);
  }

  async updateRecipeCategory(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/recipe-category/manage/${id}`, data);
  }

  async updateRecipeCategoryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/recipe-category/update-status/${id}`, { active });
  }

  // Recipe Cuisine
  async getRecipeCuisineList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/recipe-cuisine/list`, { params });
  }

  async getRecipeCuisineById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/recipe-cuisine/manage/${id}`);
  }

  async createRecipeCuisine(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/recipe-cuisine/manage`, data);
  }

  async updateRecipeCuisine(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/recipe-cuisine/manage/${id}`, data);
  }

  async updateRecipeCuisineStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/recipe-cuisine/update-status/${id}`, { active });
  }

  // Recipe Type
  async getRecipeTypeList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/recipe-type/list`, { params });
  }

  async getRecipeTypeById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/recipe-type/manage/${id}`);
  }

  async createRecipeType(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/recipe-type/manage`, data);
  }

  async updateRecipeType(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/recipe-type/manage/${id}`, data);
  }

  async updateRecipeTypeStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/recipe-type/update-status/${id}`, { active });
  }

  // Country
  async getCountryList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/country/list`, { params });
  }

  async getCountryById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/country/manage/${id}`);
  }

  async createCountry(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/country/manage`, data);
  }

  async updateCountry(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/country/manage/${id}`, data);
  }

  async updateCountryStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/country/update-status/${id}`, { active });
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/country/dropdown`);
  }

  // State
  async getStateList(params?: any): Promise<ITableList<any>> {
    return await this.httpService.get<ITableList<any>>(`${this.baseEndpoint}/state/list`, { params });
  }

  async getStateById(id: number): Promise<any> {
    return await this.httpService.get<any>(`${this.baseEndpoint}/state/manage/${id}`);
  }

  async createState(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.baseEndpoint}/state/manage`, data);
  }

  async updateState(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.baseEndpoint}/state/manage/${id}`, data);
  }

  async updateStateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.baseEndpoint}/state/update-status/${id}`, { active });
  }

  async getStateDropdown(countryId?: number): Promise<IDropdownItem[]> {
    const params = countryId ? { countryId } : {};
    return await this.httpService.get<IDropdownItem[]>(`${this.baseEndpoint}/state/dropdown`, { params });
  }
}

