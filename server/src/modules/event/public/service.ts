import { Event, EventViews } from '../../../database/event/event';
import CustomError from '../../../utils/CustomError';
import { calculateTrendingScore } from '../../../utils/event/trending/engine';
import { getRecommendedEventsService } from '../../../utils/event/recommendation/engine';
import { isValidObjectId } from '../../../utils/isValidObjectId';


export const getEventsService = async (filters: {
  category?: string;
  location?: string;
  date?: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  // Ensure sane defaults
  const page = Math.max(filters.page, 1);
  const limit = Math.max(filters.limit, 1);
  const skip = (page - 1) * limit;

  // Base query
  const query: any = {
    status: { $in: ['published', 'live'] },
    'moderation.visibility': 'public',
    'flags.suspended': { $ne: true },
  };

  // Optional filters
  if (filters.category) query.category = filters.category;

  if (filters.location) {
    query['venue.address.city'] = new RegExp(escapeRegExp(filters.location), 'i');
  }

  if (filters.date) {
    const searchDate = new Date(filters.date);
    if (!isNaN(searchDate.getTime())) {
      query['schedule.startDate'] = { $gte: searchDate };
    }
  }

  if (filters.search) {
    const escapedSearch = escapeRegExp(filters.search);
    query.$or = [
      { title: new RegExp(escapedSearch, 'i') },
      { description: new RegExp(escapedSearch, 'i') },
      { tagline: new RegExp(escapedSearch, 'i') },
    ];
  }

  // Fetch events
  const eventsPromise = Event.find(query)
    .select(
      '_id slug title type categories tagline media.coverImage venue.name venue.address.city venue.address.state schedule.startDate schedule.endDate tickets metrics.views status'
    )
    .sort({ 'schedule.startDate': 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean for performance

  // Count total documents
  const countPromise = Event.countDocuments(query);

  // Run concurrently
  const [events, total] = await Promise.all([eventsPromise, countPromise]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Utility to safely escape user input for RegExp
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Get Event Details ---
export const getEventDetailsService = async (identifier: string, userId?: string) => {
  let event = await Event.findOne({ slug: identifier })
    .select('_id hostId slug title type moderation.sales categories description tagline highlights media status venue organizer schedule tickets features')
    .lean();

  if (!event) {
    if(!isValidObjectId(identifier)){
      throw new CustomError('Event not found', 404);
    }
    event = await Event.findById(identifier)
      .select('_id hostId slug title type moderation.sales.paused categories description tagline highlights media status venue organizer schedule tickets features')
      .lean();
  }

  if (event?.flags?.suspended || event?.moderation?.visibility === 'private') {
    throw new CustomError('Event not found', 404);
  }

  if (!event || (event.status !== 'published' && event.status !== 'live' && event.status !== 'ended')) {
    throw new CustomError('Event not found', 404);
  }

  trackEventView(event._id.toString(), userId).catch(err => {
    console.error('Error tracking event view:', err);
  });

  return event;
};

// Export recommendation service
export { getRecommendedEventsService };

// --- Get Featured Events ---
export const getFeaturedEventsService = async (limit: number) => {
  const events = await Event.find({
    'moderation.features.isFeatured': true,
    status: { $in: ['published', 'live'] },
    'moderation.visibility': 'public',
  })
    .select('_id slug title type categories tagline media.coverImage venue.name venue.address.city venue.address.state schedule.startDate schedule.endDate tickets metrics.views status')
    .sort({ 'moderation.features.featuredPriority': -1, 'moderation.features.featuredAt': -1 })
    .limit(limit)
    .lean(); // Add lean for performance
  
  return events;
};

// --- Get Trending Events ---
export const getTrendingEventsService = async (
  limit: number,
  options?: {
    includeDebug?: boolean;
    now?: Date;
  }
) => {
  const now = options?.now ?? new Date();

  // 1. Fetch candidate events only
  const events = await Event.find({
    status: { $in: ['published', 'live'] },
    'moderation.visibility': 'public',
    createdAt: {
      $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    },
    'metrics.uniqueViews': { $gte: 20 }
  })
    .select(
      '_id title slug type categories description tagline media status venue schedule tickets metrics createdAt'
    )
    .lean()
    .limit(500); // HARD SAFETY CAP

  if (!events.length) return [];

  // 2. Score events (without review data since reviews only exist for ended events)
  const scored = [];

  for (const event of events) {
    const scoredEvent = calculateTrendingScore(
      {
        ...event,
        averageRating: 0, // Reviews don't exist for active events
        reviewCount: 0
      },
      now
    );

    if (scoredEvent) {
      scored.push({
        event,
        score: scoredEvent.score,
        breakdown: scoredEvent.breakdown
      });
    }
  }
  
  // 3. Rank and limit
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit);

  // 4. Return clean domain response
  return top.map(({ event, score, breakdown }) => ({
    ...event,
    trendingScore: score,
    ...(options?.includeDebug && {
      _trendingBreakdown: breakdown
    })
  }));
};



// --- Track Event View ---
async function trackEventView(eventId: string, userId?: string) {
  const now = new Date();

  await Event.updateOne({
      _id: eventId 
    }, { 
      $inc: { 'metrics.views': 1 }, 
      $set: { 'metrics.lastViewedAt': now } 
    });
  
  if (!userId) return;

  const viewed = await EventViews.findOne({ eventId, userId });
  if (viewed) return;

  await EventViews.create({ eventId, userId });
  
  await Event.updateOne({ _id: eventId }, { $inc: { 'metrics.uniqueViews': 1 } });
}
// --- Get Past Events ---
export const getPastEventsService = async (limit: number = 10) => {
  const events = await Event.find({
    status: 'ended',
    'moderation.visibility': 'public',
    'flags.suspended': { $ne: true },
  })
    .select('_id slug title type categories tagline media.coverImage venue.name venue.address.city venue.address.state schedule.startDate schedule.endDate metrics.views status')
    .sort({ 'schedule.startDate': -1 })
    .limit(limit)
    .lean();
    
  return events;
};
