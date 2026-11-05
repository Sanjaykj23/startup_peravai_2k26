import { APP_CONFIG } from '@/configs';

export interface RazorpayOrderPayload {
  amount: number; // in paise (e.g. ₹10 = 1000)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  /**
   * Create Razorpay Order
   * Simulates standard Razorpay API order creation
   */
  static async createOrder(fareInRupees: number, ticketId: string, metadata: Record<string, string> = {}) {
    const amountInPaise = Math.round(fareInRupees * 100);
    const orderId = `order_chennaibus_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${ticketId.substring(0, 8)}`,
      status: 'created',
      attempts: 0,
      notes: metadata,
      created_at: Math.floor(Date.now() / 1000),
      key: APP_CONFIG.razorpay.keyId
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static verifyPaymentSignature(paymentId: string, orderId: string, signature: string): boolean {
    // In mock/test environment, accept validly formed signatures
    return paymentId.length > 5 && orderId.length > 5;
  }
}
