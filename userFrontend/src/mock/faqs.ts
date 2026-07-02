import type { FaqItem } from '@/types';

export const FAQS: FaqItem[] = [
  {
    id: 'faq_1',
    category: 'Booking',
    question: 'How do I book a venue?',
    answer:
      'Search for a venue, open its details page, pick your date, event type, package and guest count, then tap “Continue Booking”. You’ll review pricing and pay securely to confirm.',
  },
  {
    id: 'faq_2',
    category: 'Booking',
    question: 'Do I need an account to book?',
    answer:
      'You can browse freely, but you must sign in or create an account before completing a booking so we can attach it to your profile and send confirmations.',
  },
  {
    id: 'faq_3',
    category: 'Payments',
    question: 'Can I pay an advance instead of the full amount?',
    answer:
      'For large events (weddings, conferences and corporate events) you can pay a 25% advance to reserve the venue and settle the balance later. Smaller events such as birthdays and meetings require full payment up front.',
  },
  {
    id: 'faq_4',
    category: 'Payments',
    question: 'Which payment methods are supported?',
    answer:
      'We support credit/debit cards, UPI and wallet payments. All transactions are processed over a secure, encrypted connection.',
  },
  {
    id: 'faq_5',
    category: 'Payments',
    question: 'How are taxes and charges calculated?',
    answer:
      'Your total includes the venue/package price, any per-guest charges, a 5% service charge and 18% GST. Applicable offer discounts are deducted before tax. The full breakdown is always shown before you pay.',
  },
  {
    id: 'faq_6',
    category: 'Cancellation',
    question: 'What is the cancellation and refund policy?',
    answer:
      'Refunds depend on how far ahead you cancel. On our Standard policy you receive 100% up to 7 days before, 50% within 3–7 days, 25% within 24–72 hours, and no refund within 24 hours. The exact policy is shown on each venue.',
  },
  {
    id: 'faq_7',
    category: 'Cancellation',
    question: 'How long do refunds take?',
    answer:
      'Approved refunds are initiated immediately and typically reach your original payment method within 5–7 business days. You can track refund status under My Bookings.',
  },
  {
    id: 'faq_8',
    category: 'Reviews',
    question: 'Who can leave a review?',
    answer:
      'Only customers with a completed booking at a venue can leave a rating and review, so feedback comes from people who actually hosted an event there.',
  },
  {
    id: 'faq_9',
    category: 'Account',
    question: 'How do I save venues for later?',
    answer:
      'Tap the heart icon on any venue card or details page to save it. Saved venues appear under your profile so you can compare them later.',
  },
  {
    id: 'faq_10',
    category: 'Account',
    question: 'How do I change my password?',
    answer:
      'Go to Profile → Change Password, enter your current password and choose a new one. For security you’ll need to confirm the new password.',
  },
  {
    id: 'faq_11',
    category: 'Support',
    question: 'How do I contact support?',
    answer:
      'Raise a ticket from the Support page and our team will respond within 24 hours. You can track ticket status anytime from the same page.',
  },
  {
    id: 'faq_12',
    category: 'Support',
    question: 'Can I modify a confirmed booking?',
    answer:
      'Date and guest-count changes are subject to availability. Raise a support ticket with your booking reference and we’ll help where possible.',
  },
];
