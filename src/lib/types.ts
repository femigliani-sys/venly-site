export type SocialLink = { label: string; url: string };
export type TextPair = { title: string; text: string };

export interface SiteContent {
  home: {
    eyebrow: string;
    titleTop: string;
    titleAccent: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    ticker: string[];
    previewLabel: string;
    previewTitle: string;
    previewText: string;
  };
  about: {
    intro: string;
    history: string;
    mission: string;
    vision: string;
    values: TextPair[];
    areas: TextPair[];
    creates: string;
    pendingNote: string;
  };
  creates: {
    intro: string;
    process: TextPair[];
    note: string;
  };
  store: {
    intro: string;
    notice: string;
  };
  contact: {
    email: string;
    commercialEmail: string;
    privacyEmail: string;
    discord: string;
    socials: SocialLink[];
    pendingNote: string;
  };
  legal: {
    privacy: string;
    cookiesPolicy: string;
    terms: string;
    privacyNote: string;
  };
  consent: {
    version: string;
    policyTitle: string;
    policyText: string;
  };
  footer: {
    note: string;
  };
}

export type CategoryType = 'map' | 'product' | 'member';
export interface Category {
  id: number;
  type: CategoryType;
  name: string;
  slug: string;
  sort_order: number;
}

export type MapStatus = 'Publicado' | 'Em desenvolvimento' | 'Projeto conceitual';
export interface MapProject {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  status: MapStatus;
  cover: string;
  gallery: string[];
  video_url: string;
  featured: number;
  is_demo: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category: string;
  images: string[];
  sizes: string[];
  stock: number;
  active: number;
  featured: number;
  is_demo: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  name: string;
  nickname: string;
  role: string;
  game: string;
  bio: string;
  photo: string;
  category: string;
  socials: SocialLink[];
  sort_order: number;
}

export interface CartItem {
  slug: string;
  name: string;
  image: string;
  price_cents: number;
  size: string;
  quantity: number;
  stock: number;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export const EMPTY_CUSTOMER: CustomerData = {
  name: '', email: '', phone: '', cep: '', street: '', number: '',
  complement: '', district: '', city: '', state: '',
};

export const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];
