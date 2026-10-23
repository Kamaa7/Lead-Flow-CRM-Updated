from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.responses import JSONResponse, RedirectResponse
import stripe
import os
import logging
from dotenv import load_dotenv
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
router = APIRouter()

# This should match your frontend URL
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

@router.post("/create-checkout-session")
@router.options("/create-checkout-session")  # Add OPTIONS method for CORS preflight
async def create_checkout_session(request: Request):
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={"status": "ok"})
        
    try:
        data = await request.json()
        price_id = data.get('priceId')
        
        if not price_id:
            logger.error("No price ID provided in request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Price ID is required"
            )
        
        logger.info(f"Creating checkout session for price_id: {price_id}")
        
        try:
            # Verify the price exists
            price = stripe.Price.retrieve(price_id)
            if not price.active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid price ID"
                )
                
            # Get user from session or token if available
            user_id = None
            user_email = None
            
            # Check for Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    # Verify and decode the JWT token
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    user_id = payload.get("sub")
                    user_email = payload.get("email")
                except JWTError:
                    logger.warning("Invalid JWT token in Authorization header")
            
            # Create a new Checkout Session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{FRONTEND_URL}/pricing",
                customer_email=user_email,
                client_reference_id=user_id,
                metadata={
                    'user_id': str(user_id) if user_id else 'anonymous',
                    'price_id': price_id,
                    'timestamp': datetime.utcnow().isoformat()
                },
            )
            
            logger.info(f"Created checkout session: {session.id} for user: {user_id or 'anonymous'}")
            return JSONResponse(
                status_code=200,
                content={"id": session.id},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment processing error: {str(e)}"
            )
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

# Webhook handler for Stripe events
@router.post("/webhook")
async def webhook_received(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    if not endpoint_secret:
        logger.error("STRIPE_WEBHOOK_SECRET is not set")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured"
        )
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    
    # Handle the event
    event_type = event['type']
    logger.info(f"Received event: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            logger.info(f"Checkout session completed: {session.id}")
            
            # Extract metadata
            metadata = session.get('metadata', {})
            user_id = metadata.get('user_id')
            price_id = metadata.get('price_id')
            
            # Here you would typically:
            # 1. Verify the payment was successful
            # 2. Update your database to reflect the subscription
            # 3. Send confirmation email, etc.
            
            logger.info(f"Payment for session {session.id} was successful. User: {user_id}, Price: {price_id}")
            
        elif event_type == 'customer.subscription.updated':
            subscription = event['data']['object']
            logger.info(f"Subscription updated: {subscription.id}")
            
        elif event_type == 'customer.subscription.deleted':
            subscription = event['data']['object']
            logger.info(f"Subscription canceled: {subscription.id}")
            
    except Exception as e:
        logger.error(f"Error handling {event_type}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing {event_type}"
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "success"}
    )
