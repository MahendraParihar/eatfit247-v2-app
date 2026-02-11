import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

type LoaderPageKey =
  | 'home'
  | 'blog'
  | 'blog-detail'
  | 'product'
  | 'program-details'
  | 'checkout'
  | 'checkout-success'
  | 'contact-us'
  | 'faq'
  | 'about'
  | 'success-stories'
  | 'press-and-media'
  | 'quiz'
  | 'default';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent implements OnInit, OnDestroy {
  /**
   * Logical page key so we can show relevant, fun taglines.
   * Falls back to "default" if an unknown key is passed.
   */
  @Input() page: LoaderPageKey | string = 'default';

  /**
   * Optional override for the tagline text.
   * If provided, rotation is disabled and this text is shown instead.
   */
  @Input() message?: string;

  readonly currentTagline = signal<string>('Loading goodness...');

  private rotationIntervalId: number | null = null;

  private readonly taglinesByPage: Record<LoaderPageKey, string[]> = {
    home: [
      'Brewing a healthier you…',
      'Mixing the perfect wellness recipe…',
      'Curating your personalised wellness journey…',
    ],
    blog: [
      'Whisking up fresh wellness reads…',
      'Squeezing out juicy health tips just for you…',
      'Serving you science-backed wellness stories…',
      'Infusing your feed with mindful living insights…',
    ],
    'blog-detail': [
      'Plating this article to perfection…',
      'Slow-cooking insights for your wellness goals…',
      'Garnishing your read with expert guidance…',
    ],
    product: [
      'Handpicking plans that fit your lifestyle…',
      'Balancing taste, nutrition, and results…',
      'Designing your next healthy habit…',
    ],
    'program-details': [
      'Tailoring a program that loves your body back…',
      'Layering routines for sustainable results…',
      'Aligning food, fitness, and mindset for you…',
    ],
    checkout: [
      'Almost there—securing your wellness journey…',
      'Packing your personalised program…',
      'Locking in habits your future self will thank you for…',
    ],
    'checkout-success': [
      'Setting the table for your transformation…',
      'Lining up your first wins already…',
      'Warming up your path to better health…',
    ],
    'contact-us': [
      'Connecting you with our wellness experts…',
      'Opening a direct line to Team EatFit247…',
      'Brewing thoughtful answers for you…',
    ],
    faq: [
      'Sorting through your most-asked questions…',
      'Serving crisp answers with zero jargon…',
      'Untangling nutrition myths for you…',
    ],
    about: [
      'Sharing the story behind EatFit247…',
      'Rewinding to where your wellness story began…',
      'Opening up our kitchen of ideas…',
    ],
    'success-stories': [
      'Spotlighting real people, real results…',
      'Lining up transformation stories to inspire you…',
      'Proof-loading your motivation…',
    ],
    'press-and-media': [
      'Polishing our moments in the spotlight…',
      'Gathering mentions from across the web…',
      'Curating our media highlights for you…',
    ],
    quiz: [
      'Tuning into your body’s unique signals…',
      'Designing questions that decode your wellness type…',
      'Reading between the answers for better insights…',
    ],
    default: [
      'Loading goodness…',
      'Adding a little extra wellness to your day…',
      'Balancing taste, nutrition, and tech…',
      'Nourishing your screen with something great…',
    ],
  };

  ngOnInit(): void {
    this.updateTagline();

    // In SSR, "window" is not available. Guard access so this only runs in the browser.
    if (!this.message && typeof window !== 'undefined') {
      // Rotate taglines every few seconds while the loader is visible.
      this.rotationIntervalId = window.setInterval(() => {
        this.updateTagline();
      }, 4000);
    }
  }

  ngOnDestroy(): void {
    if (this.rotationIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.rotationIntervalId);
      this.rotationIntervalId = null;
    }
  }

  private updateTagline(): void {
    if (this.message) {
      this.currentTagline.set(this.message);
      return;
    }

    const key = (this.page?.toString().toLowerCase() as LoaderPageKey) || 'default';
    const taglines =
      this.taglinesByPage[key] ?? this.taglinesByPage['default'];

    if (!taglines.length) {
      this.currentTagline.set('Loading…');
      return;
    }

    const randomIndex = Math.floor(Math.random() * taglines.length);
    this.currentTagline.set(taglines[randomIndex]);
  }
}


