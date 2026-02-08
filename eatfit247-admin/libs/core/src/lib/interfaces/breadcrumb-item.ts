import { NavigationPathEnum } from '../enums/navigation-path-enum';

export interface BreadcrumbItem {
  title: string;
  path?: NavigationPathEnum | string;
  id?: number;
}
