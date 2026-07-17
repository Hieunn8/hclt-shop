export type MediaAsset = {
  url: string;
  alt: string;
  type?: "image" | "video";
  width?: number;
  height?: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  badge?: "hot" | "bestseller" | "new" | "featured";
  rating: number;
  reviewCount: number;
  icon?: MediaAsset;
  media: MediaAsset[];
  features: string[];
  usageSteps: string[];
  purchaseUrl?: string;
  zaloUrl?: string;
  publishedAt: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  description: string;
  productSlug: string;
  image: MediaAsset;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export type Faq = {
  id: string;
  slug?: string;
  question: string;
  answer: string;
};

export type SiteMetric = {
  id: string;
  value: string;
  label: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  image: MediaAsset;
};

export type Policy = {
  id: string;
  slug: string;
  title: string;
  content: string;
};

export type Review = {
  id: string;
  productSlug: string;
  name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type SiteSettings = {
  siteName: string;
  description: string;
  phone: string;
  email: string;
  zaloUrl: string;
  facebookUrl: string;
  address: string;
  pricingTitle: string;
  pricingDescription: string;
  contactTitle: string;
  contactDescription: string;
  contactSubmitLabel: string;
  promo: {
    active: boolean;
    text: string;
    href?: string;
  };
};

export type CatalogData = {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  heroSlides: HeroSlide[];
  testimonials: Testimonial[];
  faqs: Faq[];
  siteMetrics: SiteMetric[];
  blogPosts: BlogPost[];
  policies: Policy[];
  reviews: Review[];
};

export type ProductDetailData = {
  product: Product;
  reviews: Review[];
  related: Product[];
  settings: SiteSettings;
};
