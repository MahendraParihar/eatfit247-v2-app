import {keysIn} from "lodash";


export class CommonUtil {

  static removeEmptyPayloadAttributes(payload: any): any {

    const keys = keysIn(payload);
    for (const s of keys) {
      if (!payload[s] && payload[s] !== false) {
        delete payload[s];
      }
    }
    console.log(payload);
    return payload;
  }
}
