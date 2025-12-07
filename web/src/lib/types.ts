export type Locale = 'es' | 'en';

export type LocalizedString = {
  es: string;
  en: string;
};

export type DayOfWeek = number;

export type WeeklyEvent = {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  dayOfWeek: DayOfWeek;
  times: string[];
  durationMinutes?: number;
  featured?: boolean;
  icon?: string;
  sphereCmd?: string;
};

export type EventSlot = {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  dayOfWeek: DayOfWeek;
  time: string;
  durationMinutes?: number;
  featured?: boolean;
  icon?: string;
};

export interface WorldEvent {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  startsAt: string;
  endsAt: string;
  banner?: string;
  location?: LocalizedString;
  featured?: boolean;
  headline?: LocalizedString;
  highlights?: LocalizedString[];
  rewards?: LocalizedString[];
  warnings?: LocalizedString[];
  sphereStartCmd?: string;
  sphereEndCmd?: string; 
}

export type DonationScope = 'personal' | 'clan' | 'both';

export type DonationCategory =
  | 'item'
  | 'mount'
  | 'stat_boost'
  | 'land_mine'
  | 'land_house'
  | 'currency_ne'
  | 'currency_ne_fake';

export interface DonationPrice {
  eur?: number;
  ne?: number;
  neFake?: number;
}

export interface Donation {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  category: DonationCategory;
  isSpecial: boolean;
  showItem: boolean;
  scope: DonationScope;
  price: DonationPrice;
  featured?: boolean;
  icon?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type PackItem = {
  donationId: string;
  qty?: number;
};

export type Pack = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  items: PackItem[];
  price: DonationPrice;
  featured?: boolean;
  icon?: string;
  createdAt: string;
  updatedAt: string;
};

export type New = {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt?: LocalizedString;
  body: LocalizedString;
  cover?: string;
  tags?: string[];
  publishedAt?: string | null;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewsPage = { items: New[]; total: number; page: number; limit: number; pages: number };

export type Rule = {
  id: string;
  slug: string;
  title: LocalizedString;
  body: LocalizedString;
  category?: string | null;
  tags?: string[];
  sort: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AboutEntry = {
  id: string;
  slug: string;
  title: LocalizedString;
  role?: string | null;
  avatar?: string | null;
  body: LocalizedString;
  tags?: string[];
  sort: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}