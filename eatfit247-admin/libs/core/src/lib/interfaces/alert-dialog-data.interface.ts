import { AlertTypeEnum } from '../enums/alert-type-enum';

export interface AlertDialogDataInterface {
  title: string;
  message: string;
  positiveBtnTxt: string;
  negativeBtnTxt: string | null;
  alertType: AlertTypeEnum;
}
