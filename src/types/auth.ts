export interface Subscription {
    status: 'active' | 'pending' | 'expired' | 'canceled';
    planId: string;
    endDate: any;
    paymentId?: string;
}
