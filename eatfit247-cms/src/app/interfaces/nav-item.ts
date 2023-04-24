import {NavigationPathEnum} from "../enum/navigation-path-enum";

export interface NavItem {
  title: string;
  disabled?: boolean;
  iconName: string;
  path?: NavigationPathEnum;
  children?: NavItem[];
}
