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

// ─── Auth & User Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  createdAt: string;
}

export interface KycSubmission {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: 'national_id' | 'passport';
  frontImage: string; // base64 string
  backImage: string; // base64 string
  selfieImage: string; // base64 string
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Trip {
  id: string;
  userId: string;
  fullName: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  availableWeight: number;
  pricePerKg: number;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Shipment {
  id: string;
  userId: string;
  fullName: string;
  title: string;
  fromCity: string;
  toCity: string;
  deliveryDeadline: string;
  weight: number;
  pricePaid: number;
  category: 'documents' | 'electronics' | 'clothing' | 'food' | 'other';
  description: string;
  status: 'PENDING' | 'MATCHED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}
