import { toast } from 'react-hot-toast';

/**
 * Handles the checkout process for a given price ID
 * @param {string} priceId - The Stripe price ID for the subscription
 * @returns {Promise<void>}
 */
export const handleCheckout = async (priceId) => {
  if (!priceId) {
    const errorMsg = 'Invalid subscription plan';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Show loading state
    const loadingToast = toast.loading('Preparing checkout...');
    
    // Create checkout session
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/api/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
        credentials: 'include',
      }
    );

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create checkout session');
    }

    const { id: sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw error;
    }
    
    // The redirect will happen automatically
    toast.dismiss(loadingToast);
    
  } catch (error) {
    console.error('Checkout error:', error);
    toast.dismiss();
    toast.error(error.message || 'Failed to process payment');
    throw error; // Re-throw to allow component to handle the error
  }
};

/**
 * Validates if Stripe is properly configured
 * @returns {boolean}
 */
export const isStripeConfigured = () => {
  return !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
};
