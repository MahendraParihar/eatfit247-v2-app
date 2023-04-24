import {AlertTypeEnum} from "../enum/alert-type-enum";

export interface AlertDialogDataInterface {
  title: string;
  message: string;
  positiveBtnTxt: string;
  negativeBtnTxt: string;
  alertType: AlertTypeEnum;
}
