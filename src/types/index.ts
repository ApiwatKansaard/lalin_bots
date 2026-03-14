export interface PaymentRecord {
  house_number: string;
  resident_name: string;
  month: string;
  year: string;
  amount: string;
  paid_date: string;
  transaction_ref: string;
  slip_image_url: string;
  verified_status: string;
  recorded_by: string;
  discount: string;
}

export interface HouseRecord {
  house_number: string;
  resident_name: string;
  line_user_id: string;
  phone: string;
  move_in_date: string;
  is_active: string;
  monthly_rate: string;
  transfer_date: string;
  due_date: string;
  prior_arrears: string;
  prior_arrears_paid: string;
}

export interface VillageSettings {
  bank_account_number: string;
  bank_name: string;
  village_name: string;
}

export interface SlipData {
  amount: number;
  date: string;
  sending_bank: string;
  receiving_bank: string;
  receiving_account_number: string;
  transaction_ref: string;
  is_authentic: boolean;
}

export interface VerificationResult {
  valid: boolean;
  slip_data: SlipData | null;
  error_message: string | null;
  monthCount: number;
}

export interface RegistrationState {
  step: 'awaiting_house_number';
  timestamp: number;
}
