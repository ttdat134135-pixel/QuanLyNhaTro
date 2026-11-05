export type RoomStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';

export type WaterBillingType = 'METER' | 'PER_PERSON' | 'FIXED';

export interface Room {
  id: string;
  name: string; // e.g., "Phòng 101"
  group: string; // e.g., "Tầng 1", "Tầng 2", "Dãy A"
  price: number; // VND per month
  status: RoomStatus;
  maxRenters: number;
  currentRentersCount: number;
  area: number; // m2
  lastElectricNumber: number;
  lastWaterNumber: number;
  notes?: string;
  currentTenantId?: string;
}

export interface Tenant {
  id: string;
  roomId: string;
  fullName: string;
  phone: string;
  email: string;
  idCard: string; // CCCD / CMND
  idCardDate?: string;
  idCardPlace?: string;
  birthDate?: string;
  hometown?: string; // Quê quán / Thường trú
  vehiclePlate?: string; // Biển số xe
  deposit: number; // Tiền cọc (VND)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'ENDED';
  emergencyContact?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  roomId: string;
  tenantId: string;
  month: string; // "YYYY-MM" (e.g. "2025-05")
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  
  // Room fee
  roomFee: number;

  // Electricity
  prevElectric: number;
  currElectric: number;
  electricPrice: number;
  electricTotal: number;

  // Water
  waterType: WaterBillingType;
  prevWater: number;
  currWater: number;
  waterPrice: number;
  waterCount: number; // m3 or number of people
  waterTotal: number;

  // Other services
  internetFee: number;
  garbageFee: number;
  otherFee: number;
  otherFeeDescription?: string;
  discount: number;

  // Totals
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paidDate?: string;
  paymentMethod?: 'CASH' | 'TRANSFER' | 'OTHER';
  notes?: string;
  lastReminderSentAt?: string;
}

export interface LandlordSettings {
  houseName: string;
  landlordName: string;
  phone: string;
  email: string;
  idCard: string;
  address: string;
  bankName: string;
  bankCode: string; // Bin code or short name for VietQR (e.g., "MB", "VCB", "TCB", "ACB")
  accountNumber: string;
  accountHolder: string;
  defaultElectricRate: number; // e.g. 3500 VND/kWh
  defaultWaterRate: number; // e.g. 15000 VND/m3 or 50000 VND/person
  waterBillingType: WaterBillingType;
  defaultInternetFee: number; // e.g. 50000 VND/room
  defaultGarbageFee: number; // e.g. 30000 VND/room
  dueDayOfMonth: number; // e.g. day 5 of month
  termsAndRules: string; // Nội quy phòng trọ
}

export interface BankOption {
  code: string;
  shortName: string;
  name: string;
}
