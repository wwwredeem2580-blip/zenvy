import { Event } from '../../../database/event/event';
import { Order } from '../../../database/order/order';
import { Ticket } from '../../../database/ticket/ticket';
import mongoose from "mongoose";


export const getHostMetricesService = async (hostId: string) => {
  const hostEvents = await Event.find({ hostId }, { _id: 1 });
  const eventIds = hostEvents.map(e => e._id);
  
  if (eventIds.length === 0) {
    return {
      overview: {
        totalRevenue: 0,
        totalOrders: 0,
        totalTicketsSold: 0,
        upcomingEvents: 0,
        currency: "BDT",
        totalPayout: 0,
      },
      revenueByPeriod: { thisMonth: 0, lastMonth: 0, growth: 0 },
      recentActivity: { ordersToday: 0, ordersThisWeek: 0, revenueToday: 0 }
    };
  }
  
  // Aggregate all confirmed orders for host's events
  const metrics = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds },
        status: "confirmed"
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$pricing.total" },
        totalPayout: { $sum: "$pricing.hostPayout" },
        totalOrders: { $sum: 1 },
        totalTicketsSold: {
          $sum: {
            $reduce: {
              input: "$tickets",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.quantity"] }
            }
          }
        }
      }
    }
  ]);
  
  const overview = metrics[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTicketsSold: 0,
    totalPayout: 0,
  };
  
  // Count upcoming events
  const upcomingEvents = await Event.countDocuments({
    hostId,
    status: "published",
    "schedule.startDate": { $gte: new Date() }
  });
  
  // This month vs last month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisMonthRevenue = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds },
        status: "confirmed",
        confirmedAt: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: "$pricing.total" } } }
  ]);
  
  const lastMonthRevenue = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds },
        status: "confirmed",
        confirmedAt: { $gte: startOfLastMonth, $lt: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: "$pricing.total" } } }
  ]);
  
  const thisMonth = thisMonthRevenue[0]?.total || 0;
  const lastMonth = lastMonthRevenue[0]?.total || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  
  // Recent activity
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  
  const recentActivity = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds },
        status: "confirmed"
      }
    },
    {
      $facet: {
        today: [
          { $match: { confirmedAt: { $gte: startOfDay } } },
          {
            $group: {
              _id: null,
              orders: { $sum: 1 },
              revenue: { $sum: "$pricing.total" }
            }
          }
        ],
        week: [
          { $match: { confirmedAt: { $gte: startOfWeek } } },
          { $group: { _id: null, orders: { $sum: 1 } } }
        ]
      }
    }
  ]);
  
  return {
    overview: {
      ...overview,
      upcomingEvents,
      currency: "BDT"
    },
    revenueByPeriod: {
      thisMonth,
      lastMonth,
      growth: parseFloat(growth.toFixed(2))
    },
    recentActivity: {
      ordersToday: recentActivity[0].today[0]?.orders || 0,
      ordersThisWeek: recentActivity[0].week[0]?.orders || 0,
      revenueToday: recentActivity[0].today[0]?.revenue || 0
    }
  };
};




export const getRevenueChartService = async (hostId: string, period: string = "30d") => {
  const hostEvents = await Event.find({ hostId }, { _id: 1 });
  const eventIds = hostEvents.map(e => e._id);
  
  if (eventIds.length === 0) {
    return { data: [], total: 0, average: 0 };
  }
  
  const days = parseInt(period) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds },
        status: "confirmed",
        confirmedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$confirmedAt" }
        },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Fill missing dates with 0
  const data = [];
  const revenueMap = new Map(dailyRevenue.map(d => [d._id, d]));
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = revenueMap.get(dateStr);
    data.push({
      date: dateStr,
      revenue: dayData?.revenue || 0,
      orders: dayData?.orders || 0
    });
  }
  
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const average = total / days;
  
  return { data, total, average: parseFloat(average.toFixed(2)) };
};


export const getHostOrdersService = async (
  hostId: string,
  page: number = 1,
  limit: number = 20,
  filters: {
    eventId?: string;
    status?: string;
    search?: string;
  } = {}
) => {
  const hostEvents = await Event.find({ hostId }, { _id: 1, title: 1 });
  const eventIds = hostEvents.map(e => e._id);
  
  if (eventIds.length === 0) {
    return {
      orders: [],
      pagination: { page: 1, limit, total: 0, pages: 0 }
    };
  }
  
  // Build query
  const query: any = {
    eventId: { $in: eventIds },
    status: { $in: ["confirmed", "cancelled", "refunded"] }  // Exclude pending
  };
  
  if (filters.eventId) {
    query.eventId = filters.eventId;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { orderNumber: { $regex: filters.search, $options: "i" } },
      { buyerEmail: { $regex: filters.search, $options: "i" } }
    ];
  }
  
  // Count total
  const total = await Order.countDocuments(query);
  const pages = Math.ceil(total / limit);
  
  // Fetch orders
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("orderNumber eventId buyerEmail tickets pricing.total status createdAt")
    .lean();
  
  // Format response
  const formattedOrders = orders.map(order => {
    const event = hostEvents.find(e => e._id.toString() === order.eventId.toString());
    const ticketCount = order.tickets.reduce((sum: number, t: any) => sum + t.quantity, 0);
    
    // Mask email for privacy: user@example.com → u***@example.com
    const maskEmail = (email: string) => {
      const [name, domain] = email.split('@');
      return `${name[0]}${'*'.repeat(name.length - 1)}@${domain}`;
    };
    
    return {
      orderNumber: order.orderNumber,
      eventTitle: event?.title || "Unknown Event",
      buyerEmail: maskEmail(order.buyerEmail),
      ticketCount,
      total: order.pricing?.total,
      status: order.status,
      createdAt: order.createdAt
    };
  });
  
  return {
    orders: formattedOrders,
    pagination: { page, limit, total, pages }
  };
};

interface IEvent {
  _id: any;
  title: string;
  schedule?: {
    startDate: Date;
    endDate: Date;
  };
  venue?: {
    capacity: number;
  };
  metrics?: {
    views: number;
  };
  media?: {
    coverImage?: {
      url: string;
    };
  };
}

export const getEventsAnalytics = async (eventIds: string[]) => {
  if (eventIds.length === 0) {
    return new Map();
  }
  
  // Get order analytics
  const orderAnalytics = await Order.aggregate([
    {
      $match: {
        eventId: { $in: eventIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: "confirmed"
      }
    },
    {
      $group: {
        _id: "$eventId",
        totalRevenue: { $sum: "$pricing.total" },
        totalTicketsSold: {
          $sum: {
            $reduce: {
              input: "$tickets",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.quantity"] }
            }
          }
        },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$pricing.total" },
        firstOrderDate: { $min: "$createdAt" },
        lastOrderDate: { $max: "$createdAt" }
      }
    }
  ]);
  
  // Get event details (capacity, views, etc.)
  const events = await Event.find(
    { _id: { $in: eventIds } },
    { 
      _id: 1, 
      'venue.capacity': 1,
      'metrics.views': 1,
      'schedule.startDate': 1,
      'schedule.endDate': 1
    }
  ).lean();
  
  // Create lookup maps
  const eventDetailsMap = new Map(
    events.map(e => [
      (e._id as mongoose.Types.ObjectId).toString(), 
      {
        capacity: e.venue?.capacity || 0,
        views: e.metrics?.views || 0,
        startDate: e.schedule?.startDate,
        endDate: e.schedule?.endDate
      }
    ])
  );
  
  // Build analytics map
  const analyticsMap = new Map();
  
  orderAnalytics.forEach(item => {
    const eventId = (item._id as mongoose.Types.ObjectId).toString();
    const eventDetails = eventDetailsMap.get(eventId);
    
    if (!eventDetails) return;
    
    const capacity = eventDetails.capacity || 1;
    const views = eventDetails.views || 0;
    const ticketsSold = item.totalTicketsSold || 0;
    const orders = item.totalOrders || 0;
    
    // Calculate metrics
    const ticketsSoldPercentage = Math.round((ticketsSold / capacity) * 100);
    const conversionRate = views > 0 ? Math.round((orders / views) * 100) : 0; // Orders / Views
    const avgTicketsPerOrder = orders > 0 ? Math.round(ticketsSold / orders) : 0;
    
    analyticsMap.set(eventId, {
      totalRevenue: item.totalRevenue || 0,
      totalTicketsSold: ticketsSold,
      totalOrders: orders,
      capacity,
      views,
      ticketsSoldPercentage,
      conversionRate,
      avgOrderValue: Math.round(item.avgOrderValue || 0),
      avgTicketsPerOrder,
      firstOrderDate: item.firstOrderDate,
      lastOrderDate: item.lastOrderDate
    });
  });
  
  // Add zero-analytics for events with no orders
  eventIds.forEach(eventId => {
    if (!analyticsMap.has(eventId)) {
      const eventDetails = eventDetailsMap.get(eventId);
      analyticsMap.set(eventId, {
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalOrders: 0,
        capacity: eventDetails?.capacity || 0,
        views: eventDetails?.views || 0,
        ticketsSoldPercentage: 0,
        conversionRate: 0,
        avgOrderValue: 0,
        avgTicketsPerOrder: 0,
        firstOrderDate: null,
        lastOrderDate: null
      });
    }
  });
  
  return analyticsMap;
};


export const getEventAnalytics = async (eventId: string) => {
  // Basic analytics
  const analyticsMap = await getEventsAnalytics([eventId]);
  const basicAnalytics = analyticsMap.get(eventId);
  
  if (!basicAnalytics) {
    throw new Error('Event not found');
  }
  
  // Get ticket variant breakdown
  const ticketBreakdown = await Order.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
        status: "confirmed"
      }
    },
    { $unwind: "$tickets" },
    {
      $group: {
        _id: "$tickets.variantName",
        ticketsSold: { $sum: "$tickets.quantity" },
        revenue: { $sum: "$tickets.total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  // Get daily sales trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailySales = await Order.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
        status: "confirmed",
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 },
        tickets: {
          $sum: {
            $reduce: {
              input: "$tickets",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.quantity"] }
            }
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Fill missing dates with zeros
  const salesByDate = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = dailySales.find(d => d._id === dateStr);
    salesByDate.push({
      date: dateStr,
      revenue: dayData?.revenue || 0,
      orders: dayData?.orders || 0,
      tickets: dayData?.tickets || 0
    });
  }
  
  // Get hourly sales pattern (when do people buy?)
  const hourlySales = await Order.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
        status: "confirmed"
      }
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Always compute check-in stats — check-ins can happen before the event start time
  // (e.g. early entry, pre-event scanning). The date gate was causing counters to show 0.
  const checkInData = await Ticket.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId)
      }
    },
    {
      $group: {
        _id: "$checkInStatus",
        count: { $sum: 1 }
      }
    }
  ]);

  const checkInStats = {
    checkedIn: checkInData.find((d: any) => d._id === 'checked_in')?.count || 0,
    notCheckedIn: checkInData.find((d: any) => d._id === 'not_checked_in')?.count || 0,
    total: basicAnalytics.totalTicketsSold
  };
  
  return {
    ...basicAnalytics,
    ticketBreakdown: ticketBreakdown.map(item => ({
      variantName: item._id,
      ticketsSold: item.ticketsSold,
      revenue: item.revenue,
      orders: item.orders,
      avgPrice: item.revenue / item.ticketsSold
    })),
    salesTrend: salesByDate,
    hourlySales: hourlySales.map(h => ({
      hour: h._id,
      orders: h.orders
    })),
    checkInStats
  };
};