// lib/types.ts

export interface BillData {
  date: string;
  billNumber?: string;
  customerName: string;
  phoneNumber: string;
  products: string;
  quantity: string;
  price: string;
  totalAmount: string;
  paymentMethod?: string;
  notes?: string;
  imageSource?: string;
  timestamp?: string;
  shift?: string;
  address?: string;
}

export interface CustomerData {
  customerName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  totalPurchaseCount: number;
  totalAmountSpent: number;
  lastPurchaseDate: string;
  purchaseHistory: PurchaseRecord[];
}

export interface PurchaseRecord {
  date: string;
  products: string;
  quantity: string;
  totalAmount: string;
  billNumber?: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalSales: number;
  newCustomers: number;
  avgOrderValue: number;
  totalBalanceAmount?: number;
  salesTrend: Array<{ month: string; sales: number; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  topCustomers: Array<{
    id: number;
    name: string;
    purchases: number;
    total: number;
  }>;
  revenueBreakdown: Array<{ name: string; value: number }>;
  customerMetrics: Array<{ category: string; value: number }>;
}

// Daily Bills Types
export interface DailyBillTop {
  date: string;
  shift: string;
  packetPrice?: number;
}

export interface DailyBillItem {
  shopName: string;
  phone: string;
  packetPrice: number;
  saleQty: number;
  sampleQty: number;
  returnQty: number;
  saleAmount: number;
  sampleAmount: number;
  returnAmount: number;
  address: string;
  rep: number;
  delPerson: string;
  cashAmount?: number;
  followUpsDate?: string;
  balanceAmount?: string;
  // Legacy fields for backward compatibility
  sale?: number;
  cash?: number;
}

export interface DailyBillsInput {
  top: DailyBillTop;
  items: DailyBillItem[];
}

// Delivery Person Summary Types
export interface DeliveryPersonSummary {
  deliveryPerson: string;
  totalOrders: number;
  totalSaleAmount: number;
  totalCashAmount: number;
}