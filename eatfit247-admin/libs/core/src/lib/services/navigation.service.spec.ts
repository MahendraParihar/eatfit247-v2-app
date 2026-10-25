import { NavigationService } from './navigation.service';

/** Configurable tax treatment 8.5: a menu item with a subject shows only to admins who can read it. */
describe('NavigationService.visibleSections', () => {
  const service = new NavigationService();
  const routes = (canRead: (subject: string) => boolean): string[] =>
    service
      .visibleSections(canRead)
      .flatMap((section) => section.items)
      .flatMap((item) => [item.route, ...(item.children ?? []).map((child) => child.route)])
      .filter((route): route is string => !!route);

  it('Email Templates shows with EmailTemplate Read, and is hidden without it', () => {
    expect(routes((subject) => subject === 'EmailTemplate')).toContain('/email-templates');
    expect(routes(() => false)).not.toContain('/email-templates');
  });

  it('items without a subject always show, as before', () => {
    const all = routes(() => false);
    expect(all).toEqual(expect.arrayContaining(['/dashboard', '/tax-master', '/franchise', '/admin-rbac', '/lov-master/state']));
    expect(all.length).toBe(routes(() => true).length - 1);
  });
});
