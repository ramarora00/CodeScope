import Stripe from 'stripe';

const stripe = new Stripe('sk_test_123');

export const paymentService = {
    charge: async (amount) => {
        return stripe.charges.create({ amount, currency: 'usd' });
    }
};
