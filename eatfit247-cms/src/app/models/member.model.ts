import {MediaUploadResponseModel} from "./media-upload-response.model";
import {AdminShortInfoModel} from "./admin-short-info.model";
import {BaseModel} from "./base.model";

export class MemberListModel extends BaseModel {
  firstName: string;
  lastName: string;
  password?: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  userStatusId: number;
  deactivationReason?: string;
  franchiseId: number;
  nutritionistId?: number;
  referrerId?: number;
  countryId: number;
  countryName?: string;
  nutritionist?: AdminShortInfoModel;
  memberFranchise: MemberFranchise;
  memberReferrer?: MemberReferrer;
  isAssessmentSubmitted: boolean;

  static override fromJson(data: any): MemberListModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberListModel = new MemberListModel();
    authUserObj.id = data.memberId;
    authUserObj.firstName = data.firstName;
    authUserObj.lastName = data.lastName;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.countryCode = data.countryCode;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.emailId = data.emailId;
    authUserObj.userStatusId = data.userStatusId;
    authUserObj.deactivationReason = data.deactivationReason;
    authUserObj.franchiseId = data.franchiseId;
    authUserObj.nutritionistId = data.nutritionistId;
    authUserObj.referrerId = data.referrerId;
    authUserObj.countryId = data.countryId;
    authUserObj.countryName = data.countryName;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data['createdBy']);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data['updatedBy']);
    authUserObj.nutritionist = AdminShortInfoModel.fromJson(data['nutritionist']);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    authUserObj.isAssessmentSubmitted = data.isAssessmentSubmitted;
    if (data['memberFranchise']) {
      authUserObj.memberFranchise = MemberFranchise.fromJson(data['memberFranchise']);
    }
    if (data['memberReferrer']) {
      authUserObj.memberReferrer = MemberReferrer.fromJson(data['memberReferrer']);
    }
    return authUserObj;
  }
}

export class MemberReferrer {
  referrerId: number;
  name: string;
  companyName: string;
  imagePath: MediaUploadResponseModel[];
  emailId: string;
  contactNumber: string;

  static fromJson(data: any): MemberReferrer | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberReferrer = new MemberReferrer();
    authUserObj.referrerId = data['referrerId'];
    authUserObj.name = data['name'];
    authUserObj.companyName = data['companyName'];
    authUserObj.imagePath = data['imagePath'] ? <MediaUploadResponseModel[]>data['imagePath'] : null;
    authUserObj.emailId = data['emailId'];
    authUserObj.contactNumber = data['contactNumber'];
    return authUserObj;
  }
}

export class MemberFranchise {
  franchiseId: number;
  companyName: string;
  imagePath: MediaUploadResponseModel[];
  emailId: string;
  contactNumber: string;
  firstName: string;
  lastName: string;

  static fromJson(data: any): MemberFranchise | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberFranchise = new MemberFranchise();
    authUserObj.franchiseId = data['franchiseId'];
    authUserObj.companyName = data['companyName'];
    authUserObj.imagePath = data['imagePath'] ? <MediaUploadResponseModel[]>data['imagePath'] : null;
    authUserObj.emailId = data['emailId'];
    authUserObj.contactNumber = data['contactNumber'];
    authUserObj.firstName = data['firstName'];
    authUserObj.lastName = data['lastName'];
    return authUserObj;
  }
}

export class MemberDetailModel {
  basicInfo: MemberListModel;
  pocketGuideCount: number;
  callScheduleCount: number;
  healthIssueCount: number;
  healthParameterCount: number;
  paymentCount: number;
  healthIssues: string[];
  pocketGuides: string[];
  assessmentObj: MemberAssessmentModel;

  static fromJson(data: any): MemberDetailModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberDetailModel = new MemberDetailModel();
    authUserObj.basicInfo = MemberListModel.fromJson(data.basicInfo);
    authUserObj.pocketGuideCount = data.pocketGuideCount;
    authUserObj.callScheduleCount = data.callScheduleCount;
    authUserObj.healthIssueCount = data.healthIssueCount;
    authUserObj.healthParameterCount = data.healthParameterCount;
    authUserObj.paymentCount = data.paymentCount;
    authUserObj.healthIssues = <string[]>data.healthIssues;
    authUserObj.pocketGuides = <string[]>data.pocketGuides;
    authUserObj.assessmentObj = MemberAssessmentModel.fromJson(data.assessment);
    return authUserObj;
  }
}

export class MemberAssessmentModel {
  assessmentId: number;
  memberId: number;
  dateOfBirth: string;
  age: number;
  genderId: number;
  maritalStatusId: number;
  religionId: number;
  lifestyleId: number;
  eatingHabitId: number;
  tobaccoAmount: string;
  tobaccoFrequency: string;
  paan: string;
  smokingAmount: string;
  smokingFrequency: string;
  alcoholDrink: string;
  alcoholFrequency: string;
  alcoholAmount: string;
  aeratedDrinks: string;
  waterIntake: string;
  religious: string;
  fasting: string;
  restaurantVisit: string;
  preferredCuisine: string;
  whoCooks: string;
  hungerPeak: string;
  foodDislikes: string;
  otherFoodPreferences: string;
  doYouExercise: string;
  typeOfExerciseId: number;
  frequency: string;
  duration: string;
  time: string;
  allergies: string;
  allergySpecify: string;
  sleepingPatternId: number;
  sleepDuration: string;
  gas: string;
  hyperAcidity: string;
  constipation: string;
  periods: string;
  lmp: string;
  daysCycle: string;
  hairFall: string;
  kneePain: string;
  backPain: string;
  bloodSugarId: number;
  bloodSugarValue: string;
  cholesterol: string;
  triglycerides: string;
  hdlCholesterol: string;
  ldlCholesterol: string;
  vldlCholesterol: string;
  hgLevel: string;
  urineOutputId: number;
  supplementMedicine: string;
  wakeupTiming: string;
  bfMenu: string;
  bfTime: string;
  mmMenu: string;
  mmTime: string;
  lunchMenu: string;
  lunchTime: string;
  eveMenu: string;
  eveTime: string;
  midEveMenu: string;
  midEveTime: string;
  dinnerMenu: string;
  dinnerTime: string;
  nightSnacks: string;
  bedTime: string;
  fruitsFrequency: string;
  breakFrequency: string;
  breadAmount: string;
  sweetFrequency: string;
  sweetAmount: string;
  teaFrequency: string;
  teaAmount: string;
  remark: string;
  nutritionistSummery: string;
  gender: string;
  maritalStatus: string;
  religion: string;
  lifestyle: string;
  eatingHabit: string;
  typeOfExercise: string;
  sleepingPattern: string;
  bloodSugar: string;
  urineOutput: string;

  static fromJson(data: any): MemberAssessmentModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberAssessmentModel = new MemberAssessmentModel();
    authUserObj.assessmentId = data.assessmentId;
    authUserObj.memberId = data.memberId;
    authUserObj.dateOfBirth = data.dateOfBirth;
    authUserObj.age = data.age;
    authUserObj.genderId = data.genderId;
    authUserObj.maritalStatusId = data.maritalStatusId;
    authUserObj.religionId = data.religionId;
    authUserObj.lifestyleId = data.lifestyleId;
    authUserObj.eatingHabitId = data.eatingHabitId;
    authUserObj.tobaccoAmount = data.tobaccoAmount;
    authUserObj.tobaccoFrequency = data.tobaccoFrequency;
    authUserObj.paan = data.paan;
    authUserObj.smokingAmount = data.smokingAmount;
    authUserObj.smokingFrequency = data.smokingFrequency;
    authUserObj.alcoholDrink = data.alcoholDrink;
    authUserObj.alcoholFrequency = data.alcoholFrequency;
    authUserObj.alcoholAmount = data.alcoholAmount;
    authUserObj.aeratedDrinks = data.aeratedDrinks;
    authUserObj.waterIntake = data.waterIntake;
    authUserObj.religious = data.religious;
    authUserObj.fasting = data.fasting;
    authUserObj.restaurantVisit = data.restaurantVisit;
    authUserObj.preferredCuisine = data.preferredCuisine;
    authUserObj.whoCooks = data.whoCooks;
    authUserObj.hungerPeak = data.hungerPeak;
    authUserObj.foodDislikes = data.foodDislikes;
    authUserObj.otherFoodPreferences = data.otherFoodPreferences;
    authUserObj.doYouExercise = data.doYouExercise;
    authUserObj.typeOfExerciseId = data.typeOfExerciseId;
    authUserObj.frequency = data.frequency;
    authUserObj.duration = data.duration;
    authUserObj.time = data.time;
    authUserObj.allergies = data.allergies;
    authUserObj.allergySpecify = data.allergySpecify;
    authUserObj.sleepingPatternId = data.sleepingPatternId;
    authUserObj.sleepDuration = data.sleepDuration;
    authUserObj.gas = data.gas;
    authUserObj.hyperAcidity = data.hyperAcidity;
    authUserObj.constipation = data.constipation;
    authUserObj.periods = data.periods;
    authUserObj.lmp = data.lmp;
    authUserObj.daysCycle = data.daysCycle;
    authUserObj.hairFall = data.hairFall;
    authUserObj.kneePain = data.kneePain;
    authUserObj.backPain = data.backPain;
    authUserObj.bloodSugarId = data.bloodSugarId;
    authUserObj.bloodSugarValue = data.bloodSugarValue;
    authUserObj.cholesterol = data.cholesterol;
    authUserObj.triglycerides = data.triglycerides;
    authUserObj.hdlCholesterol = data.hdlCholesterol;
    authUserObj.ldlCholesterol = data.ldlCholesterol;
    authUserObj.vldlCholesterol = data.vldlCholesterol;
    authUserObj.hgLevel = data.hgLevel;
    authUserObj.urineOutputId = data.urineOutputId;
    authUserObj.supplementMedicine = data.supplementMedicine;
    authUserObj.wakeupTiming = data.wakeupTiming;
    authUserObj.bfMenu = data.bfMenu;
    authUserObj.bfTime = data.bfTime;
    authUserObj.mmMenu = data.mmMenu;
    authUserObj.mmTime = data.mmTime;
    authUserObj.lunchMenu = data.lunchMenu;
    authUserObj.lunchTime = data.lunchTime;
    authUserObj.eveMenu = data.eveMenu;
    authUserObj.eveTime = data.eveTime;
    authUserObj.midEveMenu = data.midEveMenu;
    authUserObj.midEveTime = data.midEveTime;
    authUserObj.dinnerMenu = data.dinnerMenu;
    authUserObj.dinnerTime = data.dinnerTime;
    authUserObj.nightSnacks = data.nightSnacks;
    authUserObj.bedTime = data.bedTime;
    authUserObj.fruitsFrequency = data.fruitsFrequency;
    authUserObj.breakFrequency = data.breakFrequency;
    authUserObj.breadAmount = data.breadAmount;
    authUserObj.sweetFrequency = data.sweetFrequency;
    authUserObj.sweetAmount = data.sweetAmount;
    authUserObj.teaFrequency = data.teaFrequency;
    authUserObj.teaAmount = data.teaAmount;
    authUserObj.remark = data.remark;
    authUserObj.nutritionistSummery = data.nutritionistSummery;
    authUserObj.gender = data.gender ? data.gender : null;
    authUserObj.maritalStatus = data.maritalStatus ? data.maritalStatus : null;
    authUserObj.religion = data.religion ? data.religion : null;
    authUserObj.lifestyle = data.lifestyle ? data.lifestyle : null;
    authUserObj.eatingHabit = data.eatingHabit ? data.eatingHabit : null;
    authUserObj.typeOfExercise = data.typeOfExercise ? data.typeOfExercise : null;
    authUserObj.sleepingPattern = data.sleepingPattern ? data.sleepingPattern : null;
    authUserObj.bloodSugar = data.bloodSugar ? data.bloodSugar : null;
    authUserObj.urineOutput = data.urineOutput ? data.urineOutput : null;
    return authUserObj;
  }
}
