import { z } from 'zod';

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters'),
  tagline: z.string()
    .min(5, 'Tagline must be at least 5 characters')
    .max(200, 'Tagline must not exceed 200 characters'),
  category: z.string({message: 'Category is required'}).min(1, 'Category is required'),
});

// Step 2: Event Details
export const eventDetailsSchema = z.object({
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  coverImage: z.string()
    .url('Please upload a valid cover image')
    .min(1, 'Cover image is required'),
});

// Step 3: Venue Setup
export const venueSchema = z.object({
  venue: z.object({
    name: z.string()
      .min(3, 'Venue name must be at least 3 characters'),
    capacity: z.number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be greater than 0'),
    address: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
    }),
  }),
});

// Step 4: Event Schedule
export const scheduleSchema = z.object({
  schedule: z.object({
    startDate: z.string()
      .min(1, 'Start date is required')
      .refine((date) => new Date(date) > new Date(), {
        message: 'Start date must be in the future'
      }),
    endDate: z.string()
      .min(1, 'End date is required'),
    doors: z.string().optional(),
  }).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
});

// Legacy: Combined logistics schema (for backward compatibility)
export const logisticsSchema = z.object({
  venue: z.object({
    name: z.string()
      .min(3, 'Venue name must be at least 3 characters'),
    capacity: z.number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be greater than 0'),
    address: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      country: z.string().default('Bangladesh'),
    }),
  }),
  schedule: z.object({
    startDate: z.string()
      .min(1, 'Start date is required')
      .refine((date) => new Date(date) > new Date(), {
        message: 'Start date must be in the future'
      }),
    endDate: z.string()
      .min(1, 'End date is required'),
    doors: z.string().optional(),
  }).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
});

// Step 4: Verification
export const verificationSchema = z.object({
  documents: z.array(z.object({
    type: z.string(),
    url: z.string(),
    filename: z.string(),
    objectKey: z.string(),
  })).optional(),
});

// Step 5: Tickets
export const ticketSchema = z.object({
  name: z.string()
    .min(3, 'Ticket name must be at least 3 characters'),
  tier: z.string(),
  price: z.object({
    amount: z.number()
      .nonnegative('Price must be 0 or greater'),
    currency: z.string().default('BDT'),
  }),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  wristbandColor: z.string()
    .min(1, 'Please select a wristband color'),
  benefits: z.array(z.string()).optional(),
});

export const ticketsStepSchema = z.object({
  tickets: z.array(ticketSchema)
    .min(1, 'At least one ticket type is required'),
});

// Step 6: Platform
export const platformSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  legalPermissionAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must confirm you have legal permission'
  }),
  platformTermsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the platform terms'
  }),
});

// Custom validation functions
export const validateTicketCapacity = (tickets: any[], venueCapacity: number): { valid: boolean; error?: string } => {
  const totalQuantity = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
  
  if (totalQuantity > venueCapacity) {
    return {
      valid: false,
      error: `Total ticket quantity (${totalQuantity}) exceeds venue capacity (${venueCapacity})`
    };
  }
  
  return { valid: true };
};

export const validateUniqueTicketNames = (tickets: any[]): { valid: boolean; error?: string; duplicates?: string[] } => {
  const names = tickets.map(t => t.name.toLowerCase().trim());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    return {
      valid: false,
      error: 'Ticket names must be unique',
      duplicates: Array.from(new Set(duplicates))
    };
  }
  
  return { valid: true };
};
