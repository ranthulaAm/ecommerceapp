import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Service {
  id: number | string;
  title: string;
  description: string;
  price: number;
  finalPrice: number;
  image_url: string;
  images?: string[];
  category: string;
  rating: number;
  review_count: number;
  seller_name: string;
  seller_avatar: string;
  discount?: Discount;
}

export interface User {
  id: number | string;
  mobile: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: number | string;
  service_id: number | string;
  user_id: number | string;
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
  tracking_status?: string;
  tracking_id?: string;
  courier_service?: string;
  price_at_order: number;
  created_at: string;
  service_title: string;
  service_image: string;
  user_name: string;
  user_mobile: string;
  user_address?: string;
  delivery?: {
    file_url: string;
    message: string;
    type: 'image' | 'video' | 'link';
    created_at: string;
  };
}

export interface Discount {
  id: number | string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  service_id: number | string | null;
  active: boolean;
}
