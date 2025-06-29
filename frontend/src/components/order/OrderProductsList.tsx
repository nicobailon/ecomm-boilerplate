import React from 'react';
import type { OrderProduct } from '@/types/order';

interface OrderProductsListProps {
  products: OrderProduct[];
}

export function OrderProductsList({ products }: OrderProductsListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items in this order
      </div>
    );
  }

  const calculateLineTotal = (item: OrderProduct) => item.price * item.quantity;
  const total = products.reduce((sum, item) => sum + calculateLineTotal(item), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Order Items</h3>
      <ul className="space-y-4" role="list">
        {products.map((item, index) => {
          const productId = item.product._id.toString();
          const productName = item.product.name ?? 'Unknown Product';
          const productImage = item.product.image ?? '/placeholder-product.png';
          
          return (
            <React.Fragment key={productId}>
              <li
                className="flex items-center gap-4"
                role="listitem"
                data-testid={`order-item-${productId}`}
              >
                <div
                  className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden"
                  data-testid={`product-image-container-${productId}`}
                >
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0" data-testid={`product-details-${productId}`}>
                  <h4
                    className="font-medium truncate"
                    title={productName}
                    data-testid={`product-name-${productId}`}
                  >
                    {productName}
                  </h4>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(item.price)} × {item.quantity}
                </div>
              </div>
              <div className="text-right font-medium">
                {formatCurrency(calculateLineTotal(item))}
              </div>
            </li>
            {index < products.length - 1 && (
              <hr className="border-gray-200" role="separator" />
            )}
            </React.Fragment>
          );
        })}
      </ul>
      <div
        className="border-t pt-4 mt-4 flex justify-between items-center font-semibold"
        data-testid="order-total-section"
      >
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}