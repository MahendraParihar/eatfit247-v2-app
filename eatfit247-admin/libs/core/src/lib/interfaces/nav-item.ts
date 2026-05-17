export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

export interface NavSection {
  label: string;
  items: MenuItem[];
}
