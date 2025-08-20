export interface Dealer {
  dealer_id?: number;
  business_name: string;
  name: string;
  email: string;
  password_hash: string;  // Database column name
  phone: string;
  business_address: string;
  city: string;
  state: string;
  pincode: string;
  tax_id: string;
  service_pincodes: string;
  service_types: string;
  is_verified: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthFormProps {
  isSignUp?: boolean;
}