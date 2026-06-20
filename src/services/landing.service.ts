import {
  Stat,
  Route,
  Feature,
  HowItWorksStep,
  LandingData,
} from '../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS: Stat[] = [
  {
    id: 'stat-1',
    label: 'Happy Users',
    value: '50K+',
    icon: 'users',
    description: 'Verified travelers and senders worldwide',
  },
  {
    id: 'stat-2',
    label: 'Countries',
    value: '120+',
    icon: 'globe',
    description: 'Global network spanning every continent',
  },
  {
    id: 'stat-3',
    label: 'Shipments',
    value: '250K+',
    icon: 'package',
    description: 'Successfully delivered packages globally',
  },
  {
    id: 'stat-4',
    label: 'Success Rate',
    value: '99.8%',
    icon: 'check-circle',
    description: 'Packages delivered safely and on time',
  },
  {
    id: 'stat-5',
    label: 'Average Rating',
    value: '4.9/5',
    icon: 'star',
    description: 'Rated by our global community',
  },
];

const ROUTES: Route[] = [
  {
    id: 'route-1',
    from: 'New York',
    fromCode: 'JFK',
    fromCity: 'New York, USA',
    to: 'London',
    toCode: 'LHR',
    toCity: 'London, UK',
    pricePerKg: '$6.5',
    rating: 4.9,
    reviews: 4200,
    popular: true,
    imageTag: 'london',
    savings: 'Save up to 70%',
  },
  {
    id: 'route-2',
    from: 'Paris',
    fromCode: 'CDG',
    fromCity: 'Paris, France',
    to: 'Dubai',
    toCode: 'DXB',
    toCity: 'Dubai, UAE',
    pricePerKg: '$7.2',
    rating: 4.8,
    reviews: 3100,
    popular: true,
    imageTag: 'dubai',
    savings: 'Save up to 65%',
  },
  {
    id: 'route-3',
    from: 'Singapore',
    fromCode: 'SIN',
    fromCity: 'Singapore',
    to: 'Sydney',
    toCode: 'SYD',
    toCity: 'Sydney, Australia',
    pricePerKg: '$8.1',
    rating: 4.9,
    reviews: 1980,
    popular: true,
    imageTag: 'sydney',
    savings: 'Save up to 60%',
  },
  {
    id: 'route-4',
    from: 'Toronto',
    fromCode: 'YYZ',
    fromCity: 'Toronto, Canada',
    to: 'London',
    toCode: 'LHR',
    toCity: 'London, UK',
    pricePerKg: '$6.9',
    rating: 4.7,
    reviews: 1540,
    popular: false,
    imageTag: 'toronto',
    savings: 'Save up to 68%',
  },
  {
    id: 'route-5',
    from: 'Mumbai',
    fromCode: 'BOM',
    fromCity: 'Mumbai, India',
    to: 'Dubai',
    toCode: 'DXB',
    toCity: 'Dubai, UAE',
    pricePerKg: '$5.9',
    rating: 4.8,
    reviews: 2760,
    popular: false,
    imageTag: 'mumbai',
    savings: 'Save up to 72%',
  },
];

const FEATURES: Feature[] = [
  {
    id: 'feature-1',
    title: 'Trusted Community',
    description: 'Every user is KYC verified with government ID for a safe and transparent experience.',
    icon: 'shield-check',
    category: 'trust',
  },
  {
    id: 'feature-2',
    title: 'Secure Escrow',
    description: 'Your payment is held safely until delivery is confirmed by both parties.',
    icon: 'lock',
    category: 'payment',
  },
  {
    id: 'feature-3',
    title: 'Great Prices',
    description: 'Ship globally at a fraction of courier costs. Save up to 70% on every shipment.',
    icon: 'tag',
    category: 'convenience',
  },
  {
    id: 'feature-4',
    title: 'Real-time Tracking',
    description: 'Stay updated every step of the way with live shipment tracking and notifications.',
    icon: 'map-pin',
    category: 'convenience',
  },
  {
    id: 'feature-5',
    title: '24/7 Support',
    description: 'Our dedicated support team is here to help you anytime, any day of the year.',
    icon: 'headphones',
    category: 'support',
  },
  {
    id: 'feature-6',
    title: 'Rated & Reviewed',
    description: 'Community-driven ratings build trust. Review every traveler and sender.',
    icon: 'star',
    category: 'trust',
  },
];

const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    id: 'step-1',
    step: 1,
    title: 'Find or Post a Trip',
    description: 'Senders find travelers going to their destination, or travelers post available luggage space.',
    icon: 'search',
  },
  {
    id: 'step-2',
    step: 2,
    title: 'Book & Pay Securely',
    description: 'Choose your match, agree on terms, and pay safely through Flyora\'s secure escrow system.',
    icon: 'credit-card',
  },
  {
    id: 'step-3',
    step: 3,
    title: 'Traveler Carries Package',
    description: 'The verified traveler picks up the package and carries it safely to the destination.',
    icon: 'briefcase',
  },
  {
    id: 'step-4',
    step: 4,
    title: 'Delivered with Care',
    description: 'Package is handed to the recipient at the destination, securely and on time.',
    icon: 'package-check',
  },
  {
    id: 'step-5',
    step: 5,
    title: 'Release & Review',
    description: 'Payment is released to the traveler once delivery is confirmed. Both parties leave a review.',
    icon: 'star',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export class LandingService {
  getStats(): Stat[] {
    return STATS;
  }

  getRoutes(popular?: boolean): Route[] {
    if (popular === true) {
      return ROUTES.filter((r) => r.popular);
    }
    return ROUTES;
  }

  getFeatures(category?: Feature['category']): Feature[] {
    if (category) {
      return FEATURES.filter((f) => f.category === category);
    }
    return FEATURES;
  }

  getHowItWorks(): HowItWorksStep[] {
    return HOW_IT_WORKS;
  }

  getLandingData(): LandingData {
    return {
      stats: this.getStats(),
      routes: this.getRoutes(),
      features: this.getFeatures(),
      howItWorks: this.getHowItWorks(),
    };
  }
}

export const landingService = new LandingService();
