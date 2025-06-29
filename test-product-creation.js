// Test script to reproduce product creation error
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test data for product creation
const testProductData = {
  name: 'Test Product',
  description: 'This is a test product description with more than 10 characters',
  price: 29.99,
  image: 'https://example.com/test-image.jpg',
  collectionId: '',
  mediaGallery: [],
  variants: []
};

async function testProductCreation() {
  try {
    console.log('Testing product creation via tRPC...');
    
    // First, let's try to create a product via tRPC endpoint
    const response = await fetch(`${BASE_URL}/api/trpc/product.create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: testProductData
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      console.error('Product creation failed with status:', response.status);
      return;
    }

    const result = JSON.parse(responseText);
    console.log('Product creation successful:', result);

  } catch (error) {
    console.error('Error during product creation test:', error);
  }
}

// Run the test
testProductCreation();
