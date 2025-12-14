import { NavigationPathEnum } from '../enums/navigation-path-enum';

export interface NavItem {
  title: string;
  disabled?: boolean;
  isActive: boolean;
  iconName: string;
  path: NavigationPathEnum;
  children?: NavItem[];
  queryParams?: { [key: string]: string };
}
