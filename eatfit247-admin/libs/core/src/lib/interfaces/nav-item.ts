export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  /** Shown only to admins with Read on this subject (`AdminSubjectEnum`); items without one are always shown */
  subject?: string;
}

export interface NavSection {
  label: string;
  items: MenuItem[];
}
