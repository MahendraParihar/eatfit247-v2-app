/**
 * Interface for card component input data
 */
export interface ICardData {
  /** Unique identifier for the card */
  id: string | number;

  /** Main title/headline of the card */
  title: string;

  /** Summary or description text */
  summary: string;

  /** URL to the full content (used for "Read More" link) */
  linkUrl?: string;

  /** Image URL to display at the top of the card */
  imageUrl?: string;

  /** Alt text for the image */
  imageAlt?: string;

  /** Category tag to display on the image (e.g., "Lifestyle", "Health") */
  category?: string;

  /** Publication or creation date */
  date?: string | Date;

  /** Formatted date string to display (if provided, overrides date formatting) */
  formattedDate?: string;

  /** Read time in minutes */
  readTime?: number;

  /** Additional CSS classes for custom styling */
  cssClass?: string;

  /** External link flag (defaults to false) */
  isExternalLink?: boolean;
}

