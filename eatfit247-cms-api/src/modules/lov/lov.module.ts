import { Module } from '@nestjs/common';
import { BloodSugarController } from './controllers/blood-sugar.controller';
import { EatingHabitController } from './controllers/eating-habit.controller';
import { GenderController } from './controllers/gender.controller';
import { HealthParameterController } from './controllers/health-parameter.controller';
import { LifestyleController } from './controllers/lifestyle.controller';
import { MaritalStatusController } from './controllers/marital-status.controller';
import { NutritiveController } from './controllers/nutritive.controller';
import { RecipeCategoryController } from './controllers/recipe-category.controller';
import { RecipeCuisineController } from './controllers/recipe-cuisine.controller';
import { ReligionController } from './controllers/religion.controller';
import { SleepingPatternController } from './controllers/sleeping-pattern.controller';
import { TypeOfExerciseController } from './controllers/type-of-exercise.controller';
import { CallTypeController } from './controllers/call-type.controller';
import { CallPurposeController } from './controllers/call-purpose.controller';
import { BlogCategoryController } from './controllers/blog-category.controller';
import { BlogAuthorController } from './controllers/blog-author.controller';
import { CountryController } from './controllers/country.controller';
import { StateController } from './controllers/state.controller';
import { BlogAuthorService } from './services/blog-author.service';
import { BlogCategoryService } from './services/blog-category.service';
import { BloodSugarService } from './services/blood-sugar.service';
import { CallPurposeService } from './services/call-purpose.service';
import { CallTypeService } from './services/call-type.service';
import { CountryService } from './services/country.service';
import { EatingHabitService } from './services/eating-habit.service';
import { GenderService } from './services/gender.service';
import { HealthParameterService } from './services/health-parameter.service';
import { LifestyleService } from './services/lifestyle.service';
import { MaritalStatusService } from './services/marital-status.service';
import { NutritiveService } from './services/nutritive.service';
import { RecipeCategoryService } from './services/recipe-category.service';
import { RecipeCuisineService } from './services/recipe-cuisine.service';
import { ReligionService } from './services/religion.service';
import { SleepingPatternService } from './services/sleeping-pattern.service';
import { StateService } from './services/state.service';
import { TypeOfExerciseService } from './services/type-of-exercise.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { CommonModule } from '../common/common.module';
import { UrineOutputController } from './controllers/urine-output.controller';
import { UrineOutputService } from './services/urine-output.service';
import { HealthIssuesController } from './controllers/health-issues.controller';
import { HealthIssuesService } from './services/health-issues.service';
import { ProgramCategoryController } from './controllers/program-category.controller';
import { FaqCategoryController } from './controllers/faq-category.controller';
import { FaqCategoryService } from './services/faq-category.service';
import { ProgramCategoryService } from './services/program-category.service';
import { RecipeTypeController } from './controllers/recipe-type.controller';
import { RecipeTypeService } from './services/recipe-type.service';
import { CallStatusService } from './services/call-status.service';
import { HealthParameterUnitService } from './services/health-parameter-unit.service';
import { PaymentModeService } from './services/payment-mode.service';
import { CurrencyController } from './controllers/currency.controller';
import { CurrencyService } from './services/currency.service';
import { PaymentStatusService } from './services/payment-status.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList), CommonModule],
  controllers: [
    BlogAuthorController,
    BlogCategoryController,
    BloodSugarController,
    CallTypeController,
    CallPurposeController,
    CountryController,
    EatingHabitController,
    FaqCategoryController,
    GenderController,
    HealthIssuesController,
    HealthParameterController,
    LifestyleController,
    MaritalStatusController,
    NutritiveController,
    ProgramCategoryController,
    RecipeCategoryController,
    RecipeCuisineController,
    RecipeTypeController,
    ReligionController,
    SleepingPatternController,
    StateController,
    TypeOfExerciseController,
    UrineOutputController,
    CurrencyController,
  ],
  providers: [
    BlogAuthorService,
    BlogCategoryService,
    BloodSugarService,
    CallPurposeService,
    CallTypeService,
    CountryService,
    EatingHabitService,
    GenderService,
    HealthParameterService,
    LifestyleService,
    MaritalStatusService,
    NutritiveService,
    RecipeCategoryService,
    RecipeCuisineService,
    ReligionService,
    SleepingPatternService,
    StateService,
    TypeOfExerciseService,
    UrineOutputService,
    HealthIssuesService,
    RecipeTypeService,
    RecipeCategoryService,
    RecipeCuisineService,
    FaqCategoryService,
    ProgramCategoryService,
    HealthParameterUnitService,
    CallStatusService,
    PaymentModeService,
    CurrencyService,
    PaymentStatusService,
  ],
})
export class LovModule {}
