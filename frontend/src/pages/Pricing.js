import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Stripe price IDs - replace these with your actual price IDs from Stripe Dashboard
const PRICE_IDS = {
  starter: process.env.REACT_APP_STRIPE_PRICE_STARTER || 'price_xxxxxxxxxxxxxxxxxxxxxxxx',
  professional: process.env.REACT_APP_STRIPE_PRICE_PRO || 'price_xxxxxxxxxxxxxxxxxxxxxxxx',
  enterprise: process.env.REACT_APP_STRIPE_PRICE_ENTERPRISE || 'price_xxxxxxxxxxxxxxxxxxxxxxxx'
};

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: [
      'Up to 500 contacts',
      'Basic reporting',
      'Email support',
    ],
    cta: 'Get Started',
    highlight: false,
    priceId: PRICE_IDS.starter,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 59,
    features: [
      'Up to 5,000 contacts',
      'Advanced reporting',
      'Priority support',
      'Custom forms',
    ],
    cta: 'Get Started',
    highlight: true,
    tag: 'Most Popular',
    priceId: PRICE_IDS.professional,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: [
      'Unlimited contacts',
      'Custom reporting',
      '24/7 phone support',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlight: false,
    priceId: PRICE_IDS.enterprise,
  },
];

const footerLinks = {
  product: [
    { name: 'Features', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Testimonials', href: '#' },
    { name: 'FAQ', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
};

function Pricing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState({
    starter: false,
    professional: false,
    enterprise: false
  });
  const [stripeError, setStripeError] = useState(null);
  
  // Check if Stripe.js is loaded
  const isStripeLoaded = () => {
    return typeof window !== 'undefined' && window.Stripe;
  };

  const handlePlanSelect = async (planId, priceId) => {
    if (!priceId) {
      toast.error('This plan is currently unavailable. Please try again later.');
      return;
    }

    if (planId === 'enterprise') {
      navigate('/contact');
      return;
    }

    // Check if Stripe is loaded
    if (!isStripeLoaded()) {
      toast.error('Payment processor is not available. Please refresh the page and try again.');
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, [planId]: true }));
      setStripeError(null);
      
      // Create checkout session
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/api/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ priceId }),
          credentials: 'include',
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout session');
      }

      // Initialize Stripe
      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });

      if (error) {
        throw error;
      }
      
    } catch (error) {
      console.error('Checkout failed:', error);
      setStripeError(error.message);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Pricing Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border border-gray-200 p-8 flex flex-col items-center bg-white relative transition-all duration-200 ${plan.highlight ? 'bg-black text-white border-black shadow-lg scale-105 z-10' : ''}`}
              style={plan.highlight ? { backgroundColor: '#000', color: '#fff', borderColor: '#000' } : {}}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-1 rounded-t-lg font-semibold">{plan.tag}</div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
              <div className="flex items-end mb-4">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-black'}`}>${plan.price}</span>
                <span className={`ml-1 text-base ${plan.highlight ? 'text-gray-200' : 'text-gray-500'}`}>/month</span>
              </div>
              <ul className={`mb-8 space-y-2 text-sm ${plan.highlight ? 'text-white' : 'text-black'}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className={`mr-2 ${plan.highlight ? 'text-white' : 'text-black'}`}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanSelect(plan.id, PRICE_IDS[plan.id])}
                className={`w-full mt-auto py-2 rounded-md border text-sm font-medium transition-colors duration-200 ${
                  plan.highlight 
                    ? 'bg-white text-black border-white hover:bg-gray-100' 
                    : 'bg-white text-black border-black hover:bg-gray-50'
                } ${isLoading[plan.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={!PRICE_IDS[plan.id] || isLoading[plan.id]}
              >
                {isLoading[plan.id] ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : plan.cta}
              </button>
              {stripeError && plan.id === 'starter' && (
                <p className="mt-2 text-xs text-red-500">{stripeError}</p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-700">
          <div>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">LF</span>
              </div>
              <span className="ml-2 text-lg font-bold text-black">LeadFlowCRM</span>
            </div>
            <p className="text-gray-500 mb-4">The modern CRM solution for Microsoft Access users.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Product</h4>
            <ul>
              {footerLinks.product.map(link => (
                <li key={link.name}><a href={link.href} className="hover:underline">{link.name}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Company</h4>
            <ul>
              {footerLinks.company.map(link => (
                <li key={link.name}><a href={link.href} className="hover:underline">{link.name}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Legal</h4>
            <ul>
              {footerLinks.legal.map(link => (
                <li key={link.name}><a href={link.href} className="hover:underline">{link.name}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">© 2025 LeadFlowCRM. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default Pricing; 