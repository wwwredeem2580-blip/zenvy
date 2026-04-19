import { Router } from 'express';
import { 
  getEventsService,
  getEventDetailsService,
  getFeaturedEventsService,
  getTrendingEventsService,
  getRecommendedEventsService,
  getPastEventsService
} from './service';
import { handleError } from '../../../utils/handleError';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      location: req.query.location as string,
      date: req.query.date as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };
    const result = await getEventsService(filters);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching published events:', error);
    handleError(error, res);
  }
});

router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await getFeaturedEventsService(limit);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    handleError(error, res);
  }
});

router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await getTrendingEventsService(limit);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching trending events:', error);
    handleError(error, res);
  }
});

router.get('/recommended', async (req, res) => {
  try {
    const context = {
      currentEventId: req.query.eventId as string,
      currentEventCategory: req.query.category as string,
      currentEventLocation: req.query.location as string,
      userId: req.user?.sub,
      limit: parseInt(req.query.limit as string) || 10
    };
    const recommendations = await getRecommendedEventsService(context);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommended events:', error);
    handleError(error, res);
  }
});
router.get('/past', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await getPastEventsService(limit);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching past events:', error);
    handleError(error, res);
  }
});


router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const userId = req.user?.sub;
    const event = await getEventDetailsService(identifier, userId);
    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event details:', error);
    handleError(error, res);
  }
});

export default router;