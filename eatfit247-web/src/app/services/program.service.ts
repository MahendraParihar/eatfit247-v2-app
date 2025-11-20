import { Injectable } from '@angular/core';
import programsData from '../../assets/data/programs.json';

// JSON data structure from external source
interface ProgramJsonData {
  programme: string;
  pageUrl: string;
  category: string;
  ideal_for?: string[];
  who_should_do_it?: string[];
  what_you_get?: string[];
  program_features?: string[];
  description?: string;
  dose_how_to_take?: string;
  precautions?: string[];
  price_range?: string;
}

// Re-export interfaces for convenience
export interface Program {
  id: string;
  title: string;
  description?: string;
  price?: string;
  priceRange?: string;
  icon?: string;
  category?: string;
  image?: string;
  imageAlt?: string;
}

export interface ProgramDetails extends Program {
  detailedDescription?: string;
  benefits?: string[];
  duration?: string;
  includes?: string[];
  idealFor?: string[];
  whoShouldDoIt?: string[];
  doseHowToTake?: string;
  precautions?: string[];
}

/**
 * Service to manage program data
 * Provides methods to fetch program details by ID
 */
@Injectable({
  providedIn: 'root',
})
export class ProgramService {
  private readonly programs: ProgramDetails[] = this.loadPrograms();

  /**
   * Extract program ID from page URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/products\/([^\/]+)\/?$/);
    return match ? match[1] : '';
  }

  /**
   * Map JSON data to ProgramDetails
   */
  private mapJsonToProgramDetails(json: ProgramJsonData): ProgramDetails | null {
    const id = this.extractIdFromUrl(json.pageUrl);
    if (!id) return null;

    // Get existing program data for image/icon if available
    const existing = this.getExistingProgramData(id);

    // Create description - prioritize explicit description, then who_should_do_it, then ideal_for
    const description = json.description
      ? json.description
      : json.who_should_do_it && json.who_should_do_it.length > 0
      ? json.who_should_do_it[0]
      : json.ideal_for && json.ideal_for.length > 0
      ? `Ideal for ${json.ideal_for.join(', ')}`
      : undefined;

    // Create detailed description
    let detailedDescription: string | undefined;
    if (json.who_should_do_it && json.who_should_do_it.length > 0) {
      const whoPart = json.who_should_do_it.join(', ');
      const whatPart = json.what_you_get && json.what_you_get.length > 0
        ? json.what_you_get.join(', ')
        : '';
      detailedDescription = whatPart
        ? `This program is designed for ${whoPart}. ${whatPart}.`
        : `This program is designed for ${whoPart}.`;
    } else if (json.description) {
      detailedDescription = json.description;
    } else if (json.ideal_for && json.ideal_for.length > 0) {
      detailedDescription = `Ideal for ${json.ideal_for.join(', ')}.`;
    }

    return {
      id,
      title: json.programme,
      description,
      detailedDescription,
      category: json.category,
      idealFor: json.ideal_for,
      whoShouldDoIt: json.who_should_do_it,
      benefits: json.what_you_get,
      includes: json.program_features,
      doseHowToTake: json.dose_how_to_take,
      precautions: json.precautions,
      icon: existing?.icon,
      image: existing?.image,
      imageAlt: existing?.imageAlt || `${json.programme} Program`,
      priceRange: json.price_range || existing?.priceRange,
      duration: existing?.duration,
    };
  }

  /**
   * Get existing program data for merging
   */
  private getExistingProgramData(id: string): Partial<ProgramDetails> | null {
    const existingPrograms: Record<string, Partial<ProgramDetails>> = {
      'de-bloat': {
        icon: 'water_drop',
        image: '/assets/images/programs/de-bloat.jpg',
        imageAlt: 'De-bloat Program',
      },
      'weight-loss-pro': {
        icon: 'fitness_center',
        image: '/assets/images/programs/weight-loss-pro.jpg',
        imageAlt: 'Weight Loss PRO Program',
        duration: '12-16 weeks',
      },
      'weight-loss-max': {
        icon: 'trending_down',
        image: '/assets/images/programs/weight-loss-max.jpg',
        imageAlt: 'Weight Loss MAX Program',
        duration: '16-24 weeks',
      },
      'skin-hair': {
        icon: 'face',
        image: '/assets/images/programs/skin-hair.jpg',
        imageAlt: 'Skin & Hair Program',
        duration: '8-12 weeks',
      },
      'gut-health': {
        icon: 'healing',
        image: '/assets/images/programs/gut-health.jpg',
        imageAlt: 'Gut Health Program',
        duration: '6-10 weeks',
      },
      'ayurvedic-sattvic-diet': {
        icon: 'spa',
        image: '/assets/images/programs/ayurvedic-sattvic.jpg',
        imageAlt: 'Ayurvedic Sattvic Diet Program',
        duration: '8-12 weeks',
      },
      'beat-pcos': {
        icon: 'favorite',
        image: '/assets/images/programs/beat-pcos.jpg',
        imageAlt: 'Beat PCOS Program',
        duration: '12-16 weeks',
      },
      'pregnancy-health-and-care': {
        icon: 'pregnant_woman',
        image: '/assets/images/programs/pregnancy-care.jpg',
        imageAlt: 'Pregnancy Health and Care Program',
        duration: '9 months + postpartum',
      },
      'kiddos-nutrition': {
        icon: 'child_care',
        image: '/assets/images/programs/kiddos-nutrition.jpg',
        imageAlt: "Kiddo's Nutrition Program",
        duration: 'Ongoing',
      },
      'healthy-lifestyle-for-genz': {
        icon: 'emoji_people',
        image: '/assets/images/programs/genz-lifestyle.jpg',
        imageAlt: 'Healthy Lifestyle for GenZ Program',
        duration: '8-12 weeks',
      },
      'cleanse-plan': {
        icon: 'cleaning_services',
        image: '/assets/images/programs/cleanse-plan.jpg',
        imageAlt: 'Cleanse Plan Program',
        duration: '2-4 weeks',
      },
      'try-and-see-plan': {
        icon: 'explore',
        image: '/assets/images/programs/try-see-plan.jpg',
        imageAlt: 'Try and See Plan Program',
        duration: '4 weeks',
      },
      'muscle-gain': {
        icon: 'sports_martial_arts',
        image: '/assets/images/programs/muscle-gain.jpg',
        imageAlt: 'Muscle Gain Program',
        duration: '12-16 weeks',
      },
    };
    return existingPrograms[id] || null;
  }

  /**
   * Load programs from JSON and merge with hardcoded data
   */
  private loadPrograms(): ProgramDetails[] {
    const jsonPrograms: ProgramDetails[] = [];
    const jsonData = programsData as ProgramJsonData[];

    // Process JSON data
    for (const json of jsonData) {
      const mapped = this.mapJsonToProgramDetails(json);
      if (mapped) {
        jsonPrograms.push(mapped);
      }
    }

    // Get IDs from JSON programs
    const jsonProgramIds = new Set(jsonPrograms.map((p) => p.id));

    // All programs are now in JSON, so no hardcoded programs needed
    // This array is kept empty but structure maintained for future extensibility
    const hardcodedPrograms: ProgramDetails[] = [
      {
        id: 'gut-health',
      title: 'Gut Health',
      description: 'Improve digestive health and gut microbiome',
      detailedDescription:
        'Our Gut Health program focuses on improving your digestive system and optimizing your gut microbiome. Through personalized nutrition plans and probiotic-rich foods, you can achieve better digestion and overall wellness.',
      icon: 'healing',
      category: 'Wellness',
      image: '/assets/images/programs/gut-health.jpg',
      imageAlt: 'Gut Health Program',
      benefits: [
        'Improved digestion',
        'Better gut microbiome',
        'Reduced digestive issues',
        'Enhanced nutrient absorption',
        'Personalized gut health plan',
      ],
      duration: '6-10 weeks',
      includes: [
        'Gut-friendly meal plans',
        'Probiotic food guidance',
        'Digestive health tips',
        'Weekly consultations',
        'Microbiome support',
      ],
    },
    {
      id: 'ayurvedic-sattvic',
      title: 'Ayurvedic / Sattvic diet',
      description: 'Traditional Ayurvedic approach to balanced nutrition',
      detailedDescription:
        'Experience the wisdom of Ayurveda with our Sattvic diet program. This traditional approach to nutrition focuses on pure, natural foods that promote balance, clarity, and spiritual well-being.',
      icon: 'spa',
      category: 'Wellness',
      image: '/assets/images/programs/ayurvedic-sattvic.jpg',
      imageAlt: 'Ayurvedic Sattvic Diet Program',
      benefits: [
        'Balanced doshas',
        'Mental clarity',
        'Spiritual well-being',
        'Traditional wisdom',
        'Natural, pure foods',
      ],
      duration: '8-12 weeks',
      includes: [
        'Dosha-based meal plans',
        'Ayurvedic principles',
        'Traditional recipes',
        'Weekly consultations',
        'Lifestyle guidance',
      ],
    },
    {
      id: 'beat-pcos',
      title: 'Beat PCOS – Balance those hormones!',
      description: 'Hormone balancing program for PCOS management',
      detailedDescription:
        'Our Beat PCOS program is specifically designed to help manage Polycystic Ovary Syndrome through targeted nutrition and lifestyle modifications. This program focuses on hormone balance, insulin sensitivity, and overall reproductive health.',
      icon: 'favorite',
      category: 'Women Health',
      image: '/assets/images/programs/beat-pcos.jpg',
      imageAlt: 'Beat PCOS Program',
      benefits: [
        'Hormone balance',
        'Improved insulin sensitivity',
        'Better menstrual health',
        'Weight management',
        'PCOS-specific nutrition',
      ],
      duration: '12-16 weeks',
      includes: [
        'PCOS-focused meal plans',
        'Hormone-balancing foods',
        'Regular consultations',
        'Progress tracking',
        'Lifestyle modifications',
      ],
    },
    {
      id: 'pregnancy-care',
      title: 'Pregnancy Health and Care',
      description: 'Complete nutrition guide for expecting mothers',
      detailedDescription:
        'Ensure a healthy pregnancy with our comprehensive nutrition program designed for expecting mothers. This program provides essential nutrients, meal plans, and expert guidance to support both mother and baby throughout pregnancy.',
      icon: 'pregnant_woman',
      category: 'Women Health',
      image: '/assets/images/programs/pregnancy-care.jpg',
      imageAlt: 'Pregnancy Health and Care Program',
      benefits: [
        'Optimal nutrition for pregnancy',
        'Healthy baby development',
        'Maternal wellness',
        'Expert pregnancy nutrition guidance',
        'Safe, natural approach',
      ],
      duration: '9 months + postpartum',
      includes: [
        'Pregnancy meal plans',
        'Essential nutrients guide',
        'Regular consultations',
        'Postpartum nutrition',
        'Expert support',
      ],
    },
    {
      id: 'kiddos-nutrition',
      title: "Kiddo's Nutrition",
      description: 'Healthy eating habits for growing children',
      detailedDescription:
        'Help your children develop healthy eating habits with our specialized nutrition program. This program makes nutrition fun and engaging while ensuring your kids get all the nutrients they need for healthy growth and development.',
      icon: 'child_care',
      category: 'Kids',
      image: '/assets/images/programs/kiddos-nutrition.jpg',
      imageAlt: "Kiddo's Nutrition Program",
      benefits: [
        'Healthy growth and development',
        'Fun, kid-friendly meals',
        'Healthy eating habits',
        'Essential nutrients',
        'Family meal planning',
      ],
      duration: 'Ongoing',
      includes: [
        'Kid-friendly meal plans',
        'Nutrition education',
        'Family consultations',
        'Recipe ideas',
        'Growth tracking',
      ],
    },
    {
      id: 'genz-lifestyle',
      title: 'Healthy lifestyle for GenZ',
      description: 'Modern nutrition solutions for the younger generation',
      detailedDescription:
        'Tailored for GenZ, this program offers modern, practical nutrition solutions that fit into busy, active lifestyles. Get personalized meal plans, quick recipes, and expert guidance designed for the digital generation.',
      icon: 'emoji_people',
      category: 'Lifestyle',
      image: '/assets/images/programs/genz-lifestyle.jpg',
      imageAlt: 'Healthy Lifestyle for GenZ Program',
      benefits: [
        'Modern, practical approach',
        'Quick and easy meals',
        'Fits busy lifestyle',
        'Digital-friendly tracking',
        'GenZ-focused guidance',
      ],
      duration: '8-12 weeks',
      includes: [
        'Quick meal plans',
        'Easy recipes',
        'Digital tracking tools',
        'Regular check-ins',
        'Lifestyle tips',
      ],
    },
    {
      id: 'muscle-gain',
      title: 'Muscle Gain',
      description: 'Build lean muscle mass with proper nutrition',
      detailedDescription:
        'Build lean muscle mass effectively with our specialized nutrition program. This program combines optimal protein intake, strategic meal timing, and expert guidance to support your muscle-building goals.',
      icon: 'sports_martial_arts',
      category: 'Fitness',
      image: '/assets/images/programs/muscle-gain.jpg',
      imageAlt: 'Muscle Gain Program',
      benefits: [
        'Lean muscle development',
        'Optimal protein intake',
        'Strategic meal timing',
        'Expert fitness nutrition',
        'Performance enhancement',
      ],
      duration: '12-16 weeks',
      includes: [
        'High-protein meal plans',
        'Pre/post workout nutrition',
        'Regular consultations',
        'Progress tracking',
        'Supplement guidance',
      ],
    },
    ].filter((p) => !jsonProgramIds.has(p.id)); // Filter out programs already in JSON

    // Return merged array: JSON programs first (they have priority), then hardcoded ones
    return [...jsonPrograms, ...hardcodedPrograms];
  }

  /**
   * Get all programs
   */
  getAllPrograms(): Program[] {
    return this.programs.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceRange: p.priceRange,
      icon: p.icon,
      category: p.category,
      image: p.image,
      imageAlt: p.imageAlt,
    }));
  }

  /**
   * Get program details by ID
   */
  getProgramById(id: string): ProgramDetails | undefined {
    return this.programs.find((p) => p.id === id);
  }

  /**
   * Check if program exists
   */
  programExists(id: string): boolean {
    return this.programs.some((p) => p.id === id);
  }
}

