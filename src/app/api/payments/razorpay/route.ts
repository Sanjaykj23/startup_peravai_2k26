import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/services/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { action, fare, ticketId, metadata, paymentId, orderId, signature } = await req.json();

    if (action === 'create_order') {
      const order = await RazorpayService.createOrder(fare || 10, ticketId || `tkt_${Date.now()}`, metadata);
      return NextResponse.json({
        success: true,
        order
      });
    }

    if (action === 'verify_payment') {
      const verified = RazorpayService.verifyPaymentSignature(paymentId, orderId, signature);
      return NextResponse.json({
        success: verified,
        status: verified ? 'captured' : 'failed'
      });
    }

    return NextResponse.json({ error: 'Invalid payment action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment processing error' }, { status: 500 });
  }
}
