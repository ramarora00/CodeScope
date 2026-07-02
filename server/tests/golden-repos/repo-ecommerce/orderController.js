import { paymentService } from './paymentService.js';
import { cartService } from './cartService.js';

export const orderController = async (req, res) => {
    const cart = cartService.getCart();
    const result = await paymentService.charge(100);
    res.json({ result, cart });
};
