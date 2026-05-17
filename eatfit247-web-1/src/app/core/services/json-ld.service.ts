import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface JsonLdOrganization {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
  };
}

export interface JsonLdWebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface JsonLdBreadcrumb {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

export interface JsonLdBlogPosting {
  '@type': 'BlogPosting';
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: { '@type': 'Person'; name: string };
  publisher?: { '@type': 'Organization'; name: string; logo?: { '@type': 'ImageObject'; url: string } };
  url?: string;
  articleBody?: string;
}

export interface JsonLdProduct {
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string[];
  brand?: { '@type': 'Brand'; name: string };
  aggregateRating?: { '@type': 'AggregateRating'; ratingValue: number; reviewCount: number };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
}

export interface JsonLdFaqPage {
  '@type': 'FAQPage';
  mainEntity: { '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }[];
}

export interface JsonLdLocalBusiness {
  '@type': 'LocalBusiness' | 'HealthAndBeautyBusiness';
  name: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
  };
  description?: string;
  image?: string;
}

export interface JsonLdPerson {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  description?: string;
}

export interface JsonLdService {
  '@type': 'Service';
  name: string;
  description?: string;
  provider?: { '@type': 'Organization'; name: string; url: string };
  areaServed?: string;
  url?: string;
}

type JsonLdData =
  | JsonLdOrganization
  | JsonLdWebSite
  | JsonLdBreadcrumb
  | JsonLdBlogPosting
  | JsonLdProduct
  | JsonLdFaqPage
  | JsonLdLocalBusiness
  | JsonLdPerson
  | JsonLdService
  | Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class JsonLdService {
  private readonly document = inject(DOCUMENT);
  private readonly scriptId = 'json-ld-schema';
  private readonly globalScriptId = 'json-ld-global';

  /**
   * Inject global (site-wide) Organization + WebSite schemas once.
   * Call from App root component on init.
   */
  injectGlobalSchemas(): void {
    if (this.document.getElementById(this.globalScriptId)) {
      return;
    }

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'EatFit247',
        url: 'https://eatfit24by7.com',
        logo: 'https://eatfit24by7.com/logo-white.svg',
        sameAs: [
          'https://www.instagram.com/shwetashah_eatfit247',
          'https://www.facebook.com/eatfit247',
          'https://www.youtube.com/@EatFit247',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'eatfit24by7@gmail.com',
        },
      } satisfies Record<string, unknown>,
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'EatFit247',
        url: 'https://eatfit24by7.com',
      } satisfies Record<string, unknown>,
    ];

    const script = this.document.createElement('script');
    script.id = this.globalScriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemas);
    this.document.head.appendChild(script);
  }

  /**
   * Inject or replace the per-page JSON-LD schema.
   */
  setPageSchema(data: JsonLdData | JsonLdData[]): void {
    this.removePageSchema();
    const script = this.document.createElement('script');
    script.id = this.scriptId;
    script.type = 'application/ld+json';
    const payload = Array.isArray(data) ? data : [data];
    script.text = JSON.stringify(
      payload.map((item) => ({ '@context': 'https://schema.org', ...item }))
    );
    this.document.head.appendChild(script);
  }

  removePageSchema(): void {
    const existing = this.document.getElementById(this.scriptId);
    if (existing) {
      existing.remove();
    }
  }

  buildBreadcrumb(items: { name: string; url: string }[]): JsonLdBreadcrumb {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  buildFaqPage(faqs: { question: string; answer: string }[]): JsonLdFaqPage {
    return {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
  }
}
