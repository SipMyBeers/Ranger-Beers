---
title: Ranger Beer Order Process
status: todo
created: 2026-03-09
---
# Ranger Beer Supply - Order Process Visual

## FLOWCHART: Custom Product Order Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RANGER BEER SUPPLY                               │
│                    CUSTOM PRODUCT WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CUSTOMER  │     │   WEBSITE   │     │   SEWING    │     │   CUSTOMER  │
│   ORDERS    │────▶│  PROCESSES  │────▶│   PARTNER   │────▶│   RECEIVES  │
│  CUSTOM     │     │   ORDER     │     │  RECEIVES   │     │   PRODUCT   │
│  PRODUCT    │     │   & PAY     │     │   ORDER     │     │   + TRACK   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  PAYMENT    │
                   │  PROCESSOR  │
                   │ (STRIPE/    │
                   │  SNIPCART)  │
                   └─────────────┘
```

---

## STEP-BY-STEP PROCESS

### STEP 1: Customer Orders
```
┌──────────────────────────────────────┐
│  Customer visits ranger-beers.com     │
│  Selects custom product (e.g.,      │
│  Waffle Bottoms with velcro)        │
│  Adds to cart                        │
└──────────────────────────────────────┘
```

### STEP 2: Payment Processing
```
┌──────────────────────────────────────┐
│  Customer completes checkout         │
│  • Credit card / PayPal              │
│  • Payment held in escrow            │
│  • Order confirmed via email         │
│  • Merchant (you) receives payment  │
│    minus fees                        │
└──────────────────────────────────────┘
```

### STEP 3: Order Notification
```
┌──────────────────────────────────────┐
│  SEWING PARTNER receives:            │
│  • Email notification                │
│  • Order specs (size, options)       │
│  • Production deadline               │
│  • Shipping address                  │
└──────────────────────────────────────┘
```

### STEP 4: Production & Shipping
```
┌──────────────────────────────────────┐
│  Sewing Partner:                     │
│  • Reviews order                     │
│  • Produces item                     │
│  • Packages product                  │
│  • Ships via USPS/Amazon             │
│  • Provides tracking #               │
└──────────────────────────────────────┘
```

### STEP 5: Delivery & Review
```
┌──────────────────────────────────────┐
│  Customer receives product            │
│  • Tracking updates                 │
│  • Delivery confirmation             │
│  • (Optional: Review/rating)        │
└──────────────────────────────────────┘
```

---

## PAYMENT FLOW

```
CUSTOMER PAYMENT
       │
       ▼
┌─────────────────┐
│  SNIPCART/     │
│  STRIPE        │─── Fees (2.9% + $0.30)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MERCHANT       │─── Your Account
│  ACCOUNT       │    (minus partner payout)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PARTNER PAYOUT │─── Sewing partner gets paid
│  (You send)     │    per agreed rate
└─────────────────┘
```

---

## PARTNER COMMUNICATION TEMPLATE

### Initial Order Email to Partner:

```
Subject: NEW ORDER #1234 - Waffle Bottoms w/ Velcro

Hi [Partner Name],

You have a new custom order!

ORDER DETAILS:
- Product: Waffle Bottoms w/ Velcro Legs
- Quantity: 1
- Size: Large
- Color: Coyote Brown
- Special Instructions: Add velcro straps on calves

CUSTOMER SHIPPING:
[Customer Name]
[Address]
[City, State ZIP]

DEADLINE: Ship within 3 business days

Please confirm receipt and provide estimated ship date.

Thanks!
Ranger Beer Supply
```

---

### Partner Payout Process:

```
WEEKLY (or per order):
1. You receive customer payment: $59.99
2. Stripe fees: -$1.94
3. Your take: $58.05
4. Partner cost (e.g., $25): -$25.00
5. Your profit: $33.05 per order
```

---

## PARTNERSHIP PRICING EXAMPLE

| Product | Sell Price | Partner Cost | Your Profit |
|---------|-----------|--------------|-------------|
| Waffle Bottoms | $59.99 | $25 | $34.99 |
| VS-17 Panel | $24.99 | $10 | $14.99 |
| Patrol Cap | $19.99 | $8 | $11.99 |
| Cat Eyes Set | $14.99 | $5 | $9.99 |

---

## KEY BENEFITS FOR PARTNER

✅ Steady orders  
✅ No marketing needed  
✅ Clear specifications  
✅ Fast payment (weekly)  
✅ Grow with your business  

---

## TO DO LIST

- [ ] Finalize partner pricing
- [ ] Set up payout system (Venmo/Zelle/PayPal)
- [ ] Create order email template
- [ ] Test order flow
- [ ] Train partner on process
