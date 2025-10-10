export class PaymentGateway {
    async process(amount: number, currency: string, method: string): Promise<boolean> {
        console.log(`Processing payment of ${amount} ${currency} via ${method}`);
        return true; // Simulate success
    }
}
