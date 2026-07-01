import { Request, Response } from 'express';
import { query } from '../services/db.service';

// Get Admin Dashboard Stats
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usersCountRes = await query('SELECT COUNT(*) as count FROM users');
    const bookingsCountRes = await query('SELECT COUNT(*) as count FROM bookings');
    const revenueRes = await query('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings');
    const tripsCountRes = await query('SELECT COUNT(*) as count FROM trips');
    const activeTripsRes = await query("SELECT COUNT(*) as count FROM trips WHERE status = 'ACTIVE'");
    const shipmentsCountRes = await query('SELECT COUNT(*) as count FROM shipments');
    const pendingKycRes = await query("SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'PENDING'");
    const waitlistCountRes = await query('SELECT COUNT(*) as count FROM waitlist');

    const totalUsers = parseInt(usersCountRes.rows[0].count, 10);
    const totalBookings = parseInt(bookingsCountRes.rows[0].count, 10);
    const totalRevenue = parseFloat(revenueRes.rows[0].total);
    const totalTrips = parseInt(tripsCountRes.rows[0].count, 10);
    const activeFlights = parseInt(activeTripsRes.rows[0].count, 10);
    const totalShipments = parseInt(shipmentsCountRes.rows[0].count, 10);
    const pendingKyc = parseInt(pendingKycRes.rows[0].count, 10);
    const waitlistCount = parseInt(waitlistCountRes.rows[0].count, 10);

    res.status(200).json({
      success: true,
      message: 'Admin statistics loaded',
      data: {
        stats: {
          totalUsers,
          totalBookings,
          totalRevenue,
          totalTrips,
          activeFlights,
          totalShipments,
          pendingKyc,
          waitlistCount,
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching admin stats',
      error: error.message,
    });
  }
};

// List all users
export const getUsersList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usersRes = await query(
      `SELECT
         id,
         full_name as "fullName",
         email,
         phone,
         role,
         kyc_status as "kycStatus",
         is_active as "isActive",
         created_at as "createdAt"
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: usersRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users list',
      error: error.message,
    });
  }
};

// Toggle user status (Suspend/Activate)
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const userCheck = await query('SELECT is_active FROM users WHERE id = $1', [id]);
    if (!userCheck.rowCount || userCheck.rowCount === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const newStatus = !userCheck.rows[0].is_active;
    await query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, id]);

    res.status(200).json({
      success: true,
      message: `User account has been successfully ${newStatus ? 'activated' : 'suspended'}`,
      data: { id, isActive: newStatus },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message,
    });
  }
};

// List all trips (flights)
export const getTripsList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tripsRes = await query(
      `SELECT
         t.id,
         t.user_id as "userId",
         u.full_name as "fullName",
         t.from_city as "fromCity",
         t.to_city as "toCity",
         t.travel_date as "travelDate",
         t.available_weight as "availableWeight",
         t.price_per_kg as "pricePerKg",
         t.notes,
         t.status,
         t.created_at as "createdAt"
       FROM trips t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: tripsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trips list',
      error: error.message,
    });
  }
};

// List all bookings
export const getBookingsList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const bookingsRes = await query(
      `SELECT
         b.id,
         b.trip_id as "tripId",
         b.shipment_id as "shipmentId",
         b.matched_weight as "matchedWeight",
         b.total_amount as "totalAmount",
         b.status,
         b.created_at as "createdAt",
         t.from_city as "fromCity",
         t.to_city as "toCity",
         t.travel_date as "travelDate",
         traveler.full_name as "travelerName",
         sender.full_name as "senderName"
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       JOIN shipments s ON b.shipment_id = s.id
       JOIN users traveler ON t.user_id = traveler.id
       JOIN users sender ON s.user_id = sender.id
       ORDER BY b.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: bookingsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings list',
      error: error.message,
    });
  }
};

// List all reviews
export const getReviewsList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviewsRes = await query(
      `SELECT
         r.id,
         r.booking_id as "bookingId",
         r.rating,
         r.comment,
         r.created_at as "createdAt",
         reviewer.full_name as "reviewerName",
         reviewee.full_name as "revieweeName"
       FROM reviews r
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       JOIN users reviewee ON r.reviewee_id = reviewee.id
       ORDER BY r.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: reviewsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews list',
      error: error.message,
    });
  }
};

// List waitlist signups
export const getWaitlistList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const waitlistRes = await query(
      `SELECT
         id,
         email,
         name,
         role,
         created_at as "createdAt"
       FROM waitlist
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: waitlistRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching waitlist list',
      error: error.message,
    });
  }
};

// List all shipments
export const getShipmentsList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shipmentsRes = await query(
      `SELECT
         s.id,
         s.user_id as "userId",
         u.full_name as "fullName",
         s.title,
         s.from_city as "fromCity",
         s.to_city as "toCity",
         s.delivery_deadline as "deliveryDeadline",
         s.weight,
         s.price_paid as "pricePaid",
         s.category,
         s.description,
         s.status,
         s.created_at as "createdAt"
       FROM shipments s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: shipmentsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shipments list',
      error: error.message,
    });
  }
};
