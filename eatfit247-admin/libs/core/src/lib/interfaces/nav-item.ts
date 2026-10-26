export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  /** AdminSubjectEnum value: the item is shown only when the user can read it. Unset = always shown. */
  subject?: string;
}

export interface NavSection {
  label: string;
  items: MenuItem[];
}
