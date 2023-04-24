import {NavigationPathEnum} from "../enum/navigation-path-enum";

export interface BreadcrumbItem {
  title: string;
  path?: NavigationPathEnum;
  id?: number;
}
