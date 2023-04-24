import { IAdminShortInfo } from './admin-user.interface';
import moment from 'moment/moment';

export interface IMemberAssessment {
  assessmentId: number;
  memberId: number;
  dateOfBirth: moment.Moment;
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
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
  gender: string;
  maritalStatus: string;
  religion: string;
  lifestyle: string;
  eatingHabit: string;
  typeOfExercise: string;
  sleepingPattern: string;
  bloodSugar: string;
  urineOutput: string;
}
