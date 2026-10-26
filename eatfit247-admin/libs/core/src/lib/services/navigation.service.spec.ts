import { AdminSubjectEnum } from '@eatfit247-shared-lib';
import { NavigationService } from './navigation.service';

describe('NavigationService.visibleSections', () => {
  const service = new NavigationService();
  const routes = (permissions: Record<string, string[]> | undefined) =>
    service
      .visibleSections(permissions)
      .flatMap((section) => section.items)
      .map((item) => item.route);

  it('hides Workshop Invoices without read on WorkshopInvoice, and drops the empty Finance section', () => {
    const sections = service.visibleSections({ [AdminSubjectEnum.Member]: ['read'] });
    expect(routes({ [AdminSubjectEnum.Member]: ['read'] })).not.toContain('/workshop-invoices');
    expect(sections.map((s) => s.label)).not.toContain('Finance');
  });

  it('hides it when the user can only create (no read)', () => {
    expect(routes({ [AdminSubjectEnum.WorkshopInvoice]: ['create'] })).not.toContain('/workshop-invoices');
  });

  it('shows it with read', () => {
    expect(routes({ [AdminSubjectEnum.WorkshopInvoice]: ['read'] })).toContain('/workshop-invoices');
  });

  it('keeps every untagged item regardless of permissions', () => {
    const untagged = service.navSections.flatMap((s) => s.items).filter((i) => !i.subject).length;
    expect(service.visibleSections(undefined).flatMap((s) => s.items)).toHaveLength(untagged);
  });
});
