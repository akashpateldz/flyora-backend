// ─── Common Types ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Health Types ─────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  environment: string;
  version: string;
  services: {
    api: 'ok' | 'down';
    database: 'ok' | 'down' | 'not_configured';
  };
}

// ─── Landing Types ────────────────────────────────────────────────────────────

export interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string;
  description: string;
}

export interface Route {
  id: string;
  from: string;
  fromCode: string;
  fromCity: string;
  to: string;
  toCode: string;
  toCity: string;
  pricePerKg: string;
  rating: number;
  reviews: number;
  popular: boolean;
  imageTag: string;
  savings: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'trust' | 'payment' | 'convenience' | 'support';
}

export interface HowItWorksStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface LandingData {
  stats: Stat[];
  routes: Route[];
  features: Feature[];
  howItWorks: HowItWorksStep[];
}

// ─── Waitlist Types ───────────────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  role?: 'traveler' | 'sender' | 'both';
  createdAt: string;
  ipAddress?: string;
}

export interface WaitlistRequest {
  email: string;
  name?: string;
  role?: 'traveler' | 'sender' | 'both';
}

export interface WaitlistResponse {
  id: string;
  email: string;
  position: number;
  message: string;
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
