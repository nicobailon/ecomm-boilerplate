export const scrollableSections = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `Section ${i + 1}`,
  description: 'This is some example content that demonstrates scrolling behavior in the drawer component.',
}));

export const cartItems = [
  {
    id: 1,
    name: 'Product 1',
    price: '$19.99',
    quantity: 2,
  },
  {
    id: 2,
    name: 'Product 2',
    price: '$29.99',
    quantity: 1,
  },
  {
    id: 3,
    name: 'Product 3',
    price: '$39.99',
    quantity: 1,
  },
];