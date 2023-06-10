export enum StringResource {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SOMETHING_WENT_WRONG = 'Something went wrong, please try again',
  SUCCESS = 'Success',

  NO_DATA_FOUND = 'No data found for selected search filter',

  // region Account
  ADMIN_INACTIVE = 'This user id is in actived by super admin',
  INVALID_USER = 'user id and password not matched',
  PENDING_FOR_ADMIN_VERIFICATION = 'Admin verification still in progress, once we verify your account details, you will able to login',
  SUCCESS_ACCOUNT_VERIFICATION = 'Your account is verify successfully, now you can login with login details',
  ACCOUNT_ALREADY_PRESENT = 'this email Id and contact number is already present in system, different Email ID or contact number',
  ACCOUNT_NOT_PRESENT = 'Account not present',
  INVALID_VERIFICATION_CODE = 'Invalid verification code',
  ACCOUNT_ALREADY_ACTIVE = 'Your account is already active, please login',
  SUCCESS_VERIFICATION_CODE_SENT = 'Verification link sent successfully to your email ID',
  ACOUNT_NOT_VERIFIED = 'Your email id still not verified, please verify your email ID',
  REPEAT_PASSWORD_NOT_MATCH = 'Password and repeat password not matched',
  INVALID_OTP = 'Otp is invalid or expired',
  // endregion

  IN_ACTIVE = 0,
  SUCCESS_DATA_CREATE = 'Data submitted successfully',
  SUCCESS_DATA_UPDATE = 'Data updated successfully',
  SUCCESS_DATA_STATUS_CHANGE = 'Status changed successfully',
  SUCCESS_PASSWORD_CHANGE = 'Password reset successfully',
  SUCCESS_DATA_UPDATE_RESPONSE = 'Response submitted successfully',
  SUCCESS_MAIL_SCHEDULE = 'Mail schedule successfully',
  SUCCESS_MAIL_SENT = 'Mail sent successfully',
  INACTIVE_USER = 'This user is in in-active state',
  CURRENT_PASSWORD = `Current password not matched`,

  NO_DIET_PLAN_FOUND = 'No diet plan found for this member',
  DIET_PLAN_UPDATE_STATUS = 'Diet plan status changed successfully',
  WARNING_DIET_PLAN_NOT_FOUND = 'Diet plan not found',
}
