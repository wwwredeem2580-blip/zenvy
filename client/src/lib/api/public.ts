import { apiClient } from './client';

export const publicService = {
  getPastEvents: async (limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/api/event/public/past?limit=${limit}`);
    return response;
  },
  getEvents: async (
    params?: {
      category?: string;
      location?: string;
      date?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/api/event/public?${queryParams}`) as any;
    return response;
  },

  getEventDetails: async (identifier: string): Promise<any> => {
    const isSlug = !/^[a-fA-F0-9]{24}$/.test(identifier) || identifier.length > 24;

    if (isSlug) {
      return await apiClient.get(`/api/event/public/${encodeURIComponent(identifier)}`);
    } else {
      return await apiClient.get(`/api/event/public/${identifier}`);
    }
  },

  getFeaturedEvents: async (limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/api/event/public/featured?limit=${limit}`);
    return response;
  },

  getTrendingEvents: async (limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/api/event/public/trending?limit=${limit}`);
    return response;
  },

  getRecommendedEvents: async (params?: {
    eventId?: string;
    category?: string;
    location?: string;
    limit?: number;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/api/event/public/recommended?${queryParams}`);
    return response;
  },

  getHostProfile: async (hostId: string): Promise<any> => {
    return await apiClient.get(`/api/public/host/${hostId}`);
  },

  getHostTrustScore: async (hostId: string): Promise<any> => {
    return await apiClient.get(`/api/public/host/${hostId}/trust-score`);
  },
};
