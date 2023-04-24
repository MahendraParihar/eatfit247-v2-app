import {DropdownItem} from "../interfaces/dropdown-item";

export class JsonUtil {

  public static getDropdownList(data: any): DropdownItem[] {
    const temp: DropdownItem[] = [];
    for (const s of data) {
      temp.push({
        id: s.id,
        name: s.name,
        isSelected: s.selected,
        parentId: s.parentId
      });
    }
    return temp;
  }
}
