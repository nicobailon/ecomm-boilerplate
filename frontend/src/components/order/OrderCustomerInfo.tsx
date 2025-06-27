import type { Order } from '@/types/order';

interface OrderCustomerInfoProps {
  order: Order;
}

export function OrderCustomerInfo({ order }: OrderCustomerInfoProps) {
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      card: 'Credit Card',
      paypal: 'PayPal',
      stripe: 'Stripe',
      cash: 'Cash on Delivery',
      bank_transfer: 'Bank Transfer',
    };
    return methods[method] || method;
  };

  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return null;
    // Remove all non-numeric characters for the tel: link
    const cleaned = phone.replace(/\D/g, '');
    return { display: phone, tel: `+${cleaned}` };
  };

  const isSameAddress = (shipping: typeof order.shippingAddress, billing: typeof order.billingAddress) => {
    if (!shipping || !billing) return false;
    return (
      shipping.line1 === billing.line1 &&
      shipping.line2 === billing.line2 &&
      shipping.city === billing.city &&
      shipping.state === billing.state &&
      shipping.postalCode === billing.postalCode &&
      shipping.country === billing.country
    );
  };

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <section
        className="space-y-4"
        data-testid="customer-info-section"
        aria-label="Customer information section"
      >
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <div className="grid gap-3">
          <div>
            <span className="text-sm text-muted-foreground" data-testid="email-label">Email</span>
            <p className="font-medium" data-testid="email-value">
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground" data-testid="name-label">Name</span>
            <p className="font-medium" data-testid="name-value">
              {order.shippingAddress?.fullName || 'Name not provided'}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground" data-testid="phone-label">Phone</span>
            <p className="font-medium" data-testid="phone-value">
              {order.shippingAddress?.phone ? (
                <a
                  href={`tel:${formatPhoneNumber(order.shippingAddress.phone)?.tel}`}
                  className="hover:underline"
                >
                  {formatPhoneNumber(order.shippingAddress.phone)?.display}
                </a>
              ) : (
                'No phone number'
              )}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground" data-testid="userid-label">User ID</span>
            <p className="font-medium" data-testid="userid-value">
              {order.user._id.toString() || 'Guest Checkout'}
            </p>
          </div>
        </div>
      </section>

      {/* Shipping Address */}
      <section
        className="space-y-4"
        data-testid="shipping-address-section"
        aria-label="Shipping address section"
      >
        <h3 className="text-lg font-semibold">Shipping Address</h3>
        {order.shippingAddress ? (
          <div className="text-sm space-y-1">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p
              className="truncate"
              title={order.shippingAddress.line1}
              data-testid="shipping-street"
            >
              {order.shippingAddress.line1}
            </p>
            {order.shippingAddress.line2 && (
              <p className="truncate" title={order.shippingAddress.line2}>
                {order.shippingAddress.line2}
              </p>
            )}
            <p>
              {[
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">No shipping address provided</p>
        )}
      </section>

      {/* Billing Address */}
      <section
        className="space-y-4"
        data-testid="billing-address-section"
        aria-label="Billing address section"
      >
        <h3 className="text-lg font-semibold">Billing Address</h3>
        {order.billingAddress ? (
          isSameAddress(order.shippingAddress, order.billingAddress) ? (
            <p className="text-muted-foreground">Same as shipping address</p>
          ) : (
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.billingAddress.fullName}</p>
              <p className="truncate" title={order.billingAddress.line1}>
                {order.billingAddress.line1}
              </p>
              {order.billingAddress.line2 && (
                <p className="truncate" title={order.billingAddress.line2}>
                  {order.billingAddress.line2}
                </p>
              )}
              <p>
                {[
                  order.billingAddress.city,
                  order.billingAddress.state,
                  order.billingAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{order.billingAddress.country}</p>
            </div>
          )
        ) : (
          <p className="text-muted-foreground">No billing address provided</p>
        )}
      </section>

      {/* Payment Information */}
      <section
        className="space-y-4"
        data-testid="payment-info-section"
        aria-label="Payment information section"
      >
        <h3 className="text-lg font-semibold">Payment Information</h3>
        <div className="grid gap-3">
          <div>
            <span className="text-sm text-muted-foreground" data-testid="payment-method-label">
              Payment Method
            </span>
            <p className="font-medium" data-testid="payment-method-value">
              {order.paymentMethod ? formatPaymentMethod(order.paymentMethod) : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground" data-testid="payment-id-label">
              Payment ID
            </span>
            <p className="font-medium text-xs font-mono" data-testid="payment-id-value">
              {order.paymentIntentId || 'N/A'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}