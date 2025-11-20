/**
 * Diet Related Enums
 * Shared across all EatFit247 applications
 */
export var DietPlanStatusEnum;
(function (DietPlanStatusEnum) {
    DietPlanStatusEnum[DietPlanStatusEnum["PENDING"] = 0] = "PENDING";
    DietPlanStatusEnum[DietPlanStatusEnum["APPROVED"] = 1] = "APPROVED";
    DietPlanStatusEnum[DietPlanStatusEnum["REJECTED"] = 2] = "REJECTED";
    DietPlanStatusEnum[DietPlanStatusEnum["DRAFT"] = 3] = "DRAFT";
})(DietPlanStatusEnum || (DietPlanStatusEnum = {}));
export var DietTypeEnum;
(function (DietTypeEnum) {
    DietTypeEnum[DietTypeEnum["WEIGHT_LOSS"] = 1] = "WEIGHT_LOSS";
    DietTypeEnum[DietTypeEnum["WEIGHT_GAIN"] = 2] = "WEIGHT_GAIN";
    DietTypeEnum[DietTypeEnum["MAINTENANCE"] = 3] = "MAINTENANCE";
    DietTypeEnum[DietTypeEnum["THERAPEUTIC"] = 4] = "THERAPEUTIC";
    DietTypeEnum[DietTypeEnum["SPORTS_NUTRITION"] = 5] = "SPORTS_NUTRITION";
})(DietTypeEnum || (DietTypeEnum = {}));
export var MealTypeEnum;
(function (MealTypeEnum) {
    MealTypeEnum[MealTypeEnum["BREAKFAST"] = 1] = "BREAKFAST";
    MealTypeEnum[MealTypeEnum["MID_MORNING"] = 2] = "MID_MORNING";
    MealTypeEnum[MealTypeEnum["LUNCH"] = 3] = "LUNCH";
    MealTypeEnum[MealTypeEnum["EVENING_SNACK"] = 4] = "EVENING_SNACK";
    MealTypeEnum[MealTypeEnum["DINNER"] = 5] = "DINNER";
    MealTypeEnum[MealTypeEnum["POST_DINNER"] = 6] = "POST_DINNER";
})(MealTypeEnum || (MealTypeEnum = {}));
