import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'about-us', renderMode: RenderMode.Server },
  { path: 'about-shweta-shah', renderMode: RenderMode.Server },
  { path: 'our-programs', renderMode: RenderMode.Server },
  { path: 'success-stories', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/:slug', renderMode: RenderMode.Server },
  { path: 'press-and-media', renderMode: RenderMode.Server },
  { path: 'product', renderMode: RenderMode.Server },
  { path: 'product/:slug', renderMode: RenderMode.Server },
  { path: 'faq', renderMode: RenderMode.Server },
  { path: 'contact-us', renderMode: RenderMode.Server },
  { path: 'terms-and-conditions', renderMode: RenderMode.Server },
  { path: 'privacy-policy', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
