import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../services/db.service';

// Create a Traveler Trip
export const createTrip = async (req: Request, res: Response): Promise<void> => {
  const { userId, fromCity, toCity, travelDate, availableWeight, pricePerKg, description } = req.body;

  if (!userId || !fromCity || !toCity || !travelDate || availableWeight === undefined || pricePerKg === undefined) {
    res.status(400).json({
      success: false,
      message: 'All fields (userId, fromCity, toCity, travelDate, availableWeight, pricePerKg) are required',
    });
    return;
  }

  try {
    // Check user
    const userRes = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userName = userRes.rows[0].full_name;

    // Insert trip
    const insertRes = await query(
      `INSERT INTO trips (user_id, from_city, to_city, travel_date, available_weight, price_per_kg, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING id, user_id as "userId", from_city as "fromCity", to_city as "toCity", travel_date as "travelDate", available_weight as "availableWeight", price_per_kg as "pricePerKg", notes as "description", status, created_at as "createdAt"`,
      [
        userId,
        fromCity.trim(),
        toCity.trim(),
        travelDate,
        Number(availableWeight),
        Number(pricePerKg),
        description ? description.trim() : null
      ]
    );

    const trip = insertRes.rows[0];
    // Attach fullName matching original contract
    trip.fullName = userName;

    // Insert notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Travel Capacity Registered', $2, 'system')`,
      [userId, `Your capacity of ${availableWeight} kg from ${fromCity.trim()} to ${toCity.trim()} on ${travelDate} has been registered.`]
    );

    res.status(201).json({
      success: true,
      message: 'Trip registered successfully',
      data: trip,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error creating trip',
      error: error.message,
    });
  }
};

// Get all trips for a traveler
export const getUserTrips = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

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
         t.notes as "description",
         t.status,
         t.created_at as "createdAt"
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'User trips retrieved successfully',
      data: tripsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user trips',
      error: error.message,
    });
  }
};

// Create a Shipment Request
export const createShipment = async (req: Request, res: Response): Promise<void> => {
  const { userId, title, fromCity, toCity, deliveryDeadline, weight, pricePaid, category, description } = req.body;

  if (!userId || !title || !fromCity || !toCity || !deliveryDeadline || weight === undefined || pricePaid === undefined || !category || !description) {
    res.status(400).json({
      success: false,
      message: 'All fields (userId, title, fromCity, toCity, deliveryDeadline, weight, pricePaid, category, description) are required',
    });
    return;
  }

  try {
    // Check user
    const userRes = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userName = userRes.rows[0].full_name;

    // Insert shipment
    const insertRes = await query(
      `INSERT INTO shipments (user_id, title, from_city, to_city, delivery_deadline, weight, price_paid, category, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
       RETURNING id, user_id as "userId", title, from_city as "fromCity", to_city as "toCity", delivery_deadline as "deliveryDeadline", weight, price_paid as "pricePaid", category, description, status, created_at as "createdAt"`,
      [
        userId,
        title.trim(),
        fromCity.trim(),
        toCity.trim(),
        deliveryDeadline,
        Number(weight),
        Number(pricePaid),
        category,
        description.trim()
      ]
    );

    const shipment = insertRes.rows[0];
    shipment.fullName = userName;

    // Deduct wallet balance
    await query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [Number(pricePaid), userId]
    );

    // Insert wallet transaction
    await query(
      `INSERT INTO wallet_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'debit', $3)`,
      [userId, Number(pricePaid), `Escrow locked: ${title.trim()} (${fromCity.trim()} ➔ ${toCity.trim()})`]
    );

    // Insert notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Parcel Shipment Created', $2, 'system')`,
      [userId, `Your shipment request for "${title.trim()}" to be sent from ${fromCity.trim()} to ${toCity.trim()} has been published.`]
    );

    res.status(201).json({
      success: true,
      message: 'Shipment request created successfully',
      data: shipment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error creating shipment',
      error: error.message,
    });
  }
};

// Get shipments for a sender
export const getUserShipments = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

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
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'User shipments retrieved successfully',
      data: shipmentsRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user shipments',
      error: error.message,
    });
  }
};

// Get Dashboard Overview (Stats, Wallet simulated data, Smart Matches)
export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

  try {
    // Check user
    const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Active counts
    const activeTripsRes = await query(
      "SELECT COUNT(*) as count FROM trips WHERE user_id = $1 AND status = 'ACTIVE'",
      [userId]
    );
    const activeTripsCount = parseInt(activeTripsRes.rows[0].count, 10);

    const activeShipmentsRes = await query(
      "SELECT COUNT(*) as count FROM shipments WHERE user_id = $1 AND status IN ('PENDING', 'MATCHED')",
      [userId]
    );
    const activeShipmentsCount = parseInt(activeShipmentsRes.rows[0].count, 10);

    // Total Shipments Count
    const totalShipmentsRes = await query(
      "SELECT COUNT(*) as count FROM shipments WHERE user_id = $1",
      [userId]
    );
    const totalShipmentsCount = parseInt(totalShipmentsRes.rows[0].count, 10);

    // Total Trips Count
    const totalTripsRes = await query(
      "SELECT COUNT(*) as count FROM trips WHERE user_id = $1",
      [userId]
    );
    const totalTripsCount = parseInt(totalTripsRes.rows[0].count, 10);

    // Completed Shipments Count
    const completedShipmentsRes = await query(
      "SELECT COUNT(*) as count FROM shipments WHERE user_id = $1 AND status = 'DELIVERED'",
      [userId]
    );
    const completedShipmentsCount = parseInt(completedShipmentsRes.rows[0].count, 10);

    // Total Spend on shipments
    const totalSpendRes = await query(
      "SELECT COALESCE(SUM(price_paid), 0) as spend FROM shipments WHERE user_id = $1 AND status <> 'CANCELLED'",
      [userId]
    );
    const totalSpend = parseFloat(totalSpendRes.rows[0].spend);

    // Status-wise counts for pipeline overview
    const pendingCountRes = await query(
      "SELECT COUNT(*) as count FROM shipments WHERE user_id = $1 AND status = 'PENDING'",
      [userId]
    );
    const pendingCount = parseInt(pendingCountRes.rows[0].count, 10);

    const inTransitCountRes = await query(
      `SELECT COUNT(*) as count 
       FROM bookings b
       JOIN shipments s ON b.shipment_id = s.id
       WHERE s.user_id = $1 AND b.status IN ('ACCEPTED', 'PAID')`,
      [userId]
    );
    const inTransitCount = parseInt(inTransitCountRes.rows[0].count, 10);

    const outForDeliveryCountRes = await query(
      `SELECT COUNT(*) as count 
       FROM bookings b
       JOIN shipments s ON b.shipment_id = s.id
       WHERE s.user_id = $1 AND b.status = 'IN_TRANSIT'`,
      [userId]
    );
    const outForDeliveryCount = parseInt(outForDeliveryCountRes.rows[0].count, 10);

    const deliveredCountRes = await query(
      "SELECT COUNT(*) as count FROM shipments WHERE user_id = $1 AND status = 'DELIVERED'",
      [userId]
    );
    const deliveredCount = parseInt(deliveredCountRes.rows[0].count, 10);

    // Escrow balance
    const escrowRes = await query(
      "SELECT COALESCE(SUM(price_paid), 0) as balance FROM shipments WHERE user_id = $1 AND status = 'PENDING'",
      [userId]
    );
    const escrowBalance = parseFloat(escrowRes.rows[0].balance);

    // Matches logic:
    // 1. Matches for this user's active trips: find pending shipments by other users between same cities
    const travelMatchesRes = await query(
      `SELECT
         t.id as "tripId",
         CONCAT(t.from_city, ' ➔ ', t.to_city, ' (', TO_CHAR(t.travel_date, 'YYYY-MM-DD'), ')') as "tripDetails",
         'shipment_match' as "matchType",
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
       FROM trips t
       JOIN shipments s ON s.user_id <> $1
         AND s.status = 'PENDING'
         AND LOWER(TRIM(s.from_city)) = LOWER(TRIM(t.from_city))
         AND LOWER(TRIM(s.to_city)) = LOWER(TRIM(t.to_city))
       JOIN users u ON s.user_id = u.id
       WHERE t.user_id = $1 AND t.status = 'ACTIVE'`,
      [userId]
    );

    // Re-format rows to nest shipment info like original code
    const travelMatches = travelMatchesRes.rows.map(row => ({
      tripId: row.tripId,
      tripDetails: row.tripDetails,
      matchType: row.matchType,
      shipment: {
        id: row.id,
        userId: row.userId,
        fullName: row.fullName,
        title: row.title,
        fromCity: row.fromCity,
        toCity: row.toCity,
        deliveryDeadline: row.deliveryDeadline,
        weight: parseFloat(row.weight),
        pricePaid: parseFloat(row.pricePaid),
        category: row.category,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt
      }
    }));

    // 2. Matches for this user's pending shipments: find active trips by other users between same cities
    const shipmentMatchesRes = await query(
      `SELECT
         s.id as "shipmentId",
         CONCAT(s.title, ' (', s.weight, 'kg)') as "shipmentDetails",
         'traveler_match' as "matchType",
         t.id,
         t.user_id as "userId",
         u.full_name as "fullName",
         t.from_city as "fromCity",
         t.to_city as "toCity",
         t.travel_date as "travelDate",
         t.available_weight as "availableWeight",
         t.price_per_kg as "pricePerKg",
         t.notes as "description",
         t.status,
         t.created_at as "createdAt"
       FROM shipments s
       JOIN trips t ON t.user_id <> $1
         AND t.status = 'ACTIVE'
         AND LOWER(TRIM(t.from_city)) = LOWER(TRIM(s.from_city))
         AND LOWER(TRIM(t.to_city)) = LOWER(TRIM(s.to_city))
       JOIN users u ON t.user_id = u.id
       WHERE s.user_id = $1 AND s.status = 'PENDING'`,
      [userId]
    );

    // Re-format rows to nest trip info like original code
    const shipmentMatches = shipmentMatchesRes.rows.map(row => ({
      shipmentId: row.shipmentId,
      shipmentDetails: row.shipmentDetails,
      matchType: row.matchType,
      trip: {
        id: row.id,
        userId: row.userId,
        fullName: row.fullName,
        fromCity: row.fromCity,
        toCity: row.toCity,
        travelDate: row.travelDate,
        availableWeight: parseFloat(row.availableWeight),
        pricePerKg: parseFloat(row.pricePerKg),
        description: row.description,
        status: row.status,
        createdAt: row.createdAt
      }
    }));
    // Fetch live wallet balance directly from database users table
    const walletRes = await query("SELECT wallet_balance as balance FROM users WHERE id = $1", [userId]);
    const walletBalance = parseFloat(walletRes.rows[0].balance);

    // Query live transactions from database
    const transactionsRes = await query(
      `SELECT id, amount, type, description, created_at as "date"
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    const transactions = transactionsRes.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      type: row.type,
      description: row.description,
      date: row.date.toISOString().split('T')[0]
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard overview data loaded',
      data: {
        stats: {
          activeTripsCount,
          activeShipmentsCount,
          totalShipmentsCount,
          totalTripsCount,
          completedShipmentsCount,
          totalSpend,
          walletBalance,
          escrowBalance,
          pendingCount,
          inTransitCount,
          outForDeliveryCount,
          deliveredCount,
        },
        matches: {
          travelMatches,
          shipmentMatches,
          totalMatchesCount: travelMatches.length + shipmentMatches.length
        },
        transactions
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error loading dashboard overview',
      error: error.message,
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { fullName, email, phone, password, profileImageUrl } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

  try {
    const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Email check
    if (email) {
      const emailTaken = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email.toLowerCase().trim(), userId]);
      if (emailTaken.rowCount && emailTaken.rowCount > 0) {
        res.status(400).json({
          success: false,
          message: 'This email address is already taken by another user',
        });
        return;
      }
    }

    // Build update parameters dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName.trim());
    }

    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase().trim());
    }

    if (phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone.trim());
    }

    if (password) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hash);
    }

    if (profileImageUrl !== undefined) {
      updates.push(`profile_image_url = $${paramIndex++}`);
      values.push(profileImageUrl);
    }

    if (updates.length > 0) {
      values.push(userId);
      await query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    // Fetch updated user to return
    const updatedUserRes = await query(
      'SELECT id, full_name as "fullName", email, phone, profile_image_url as "profileImageUrl" FROM users WHERE id = $1',
      [userId]
    );

    const user = updatedUserRes.rows[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error updating user profile',
      error: error.message,
    });
  }
};

// Update Trip
export const updateTrip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { fromCity, toCity, travelDate, availableWeight, pricePerKg, description, status } = req.body;

  try {
    const tripRes = await query('SELECT id FROM trips WHERE id = $1', [id]);
    if (!tripRes.rowCount || tripRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (fromCity) {
      updates.push(`from_city = $${paramIndex++}`);
      values.push(fromCity.trim());
    }
    if (toCity) {
      updates.push(`to_city = $${paramIndex++}`);
      values.push(toCity.trim());
    }
    if (travelDate) {
      updates.push(`travel_date = $${paramIndex++}`);
      values.push(travelDate);
    }
    if (availableWeight !== undefined) {
      updates.push(`available_weight = $${paramIndex++}`);
      values.push(Number(availableWeight));
    }
    if (pricePerKg !== undefined) {
      updates.push(`price_per_kg = $${paramIndex++}`);
      values.push(Number(pricePerKg));
    }
    if (description !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(description.trim());
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE trips
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    const updatedRes = await query(
      `SELECT
         t.id,
         t.user_id as "userId",
         u.full_name as "fullName",
         t.from_city as "fromCity",
         t.to_city as "toCity",
         t.travel_date as "travelDate",
         t.available_weight as "availableWeight",
         t.price_per_kg as "pricePerKg",
         t.notes as "description",
         t.status,
         t.created_at as "createdAt"
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: updatedRes.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error updating trip',
      error: error.message,
    });
  }
};

// Delete Trip
export const deleteTrip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const tripRes = await query('DELETE FROM trips WHERE id = $1', [id]);
    if (tripRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Trip not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error deleting trip',
      error: error.message,
    });
  }
};

// Update Shipment
export const updateShipment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, fromCity, toCity, deliveryDeadline, weight, pricePaid, category, description, status } = req.body;

  try {
    const shipmentRes = await query('SELECT id FROM shipments WHERE id = $1', [id]);
    if (!shipmentRes.rowCount || shipmentRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Shipment not found' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    if (fromCity) {
      updates.push(`from_city = $${paramIndex++}`);
      values.push(fromCity.trim());
    }
    if (toCity) {
      updates.push(`to_city = $${paramIndex++}`);
      values.push(toCity.trim());
    }
    if (deliveryDeadline) {
      updates.push(`delivery_deadline = $${paramIndex++}`);
      values.push(deliveryDeadline);
    }
    if (weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`);
      values.push(Number(weight));
    }
    if (pricePaid !== undefined) {
      updates.push(`price_paid = $${paramIndex++}`);
      values.push(Number(pricePaid));
    }
    if (category) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description.trim());
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE shipments
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    const updatedRes = await query(
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
       WHERE s.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Shipment updated successfully',
      data: updatedRes.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error updating shipment',
      error: error.message,
    });
  }
};

// Delete Shipment
export const deleteShipment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const shipmentRes = await query('DELETE FROM shipments WHERE id = $1', [id]);
    if (shipmentRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Shipment not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error deleting shipment',
      error: error.message,
    });
  }
};

// Top up user wallet
export const topupWallet = async (req: Request, res: Response): Promise<void> => {
  const { userId, amount, description } = req.body;

  if (!userId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({
      success: false,
      message: 'userId and a valid positive amount are required',
    });
    return;
  }

  try {
    // Check if user exists
    const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const numericAmount = Number(amount);
    const desc = description ? description.trim() : 'Direct Wallet Payout Top-up';

    // 1. Update wallet balance
    await query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [numericAmount, userId]
    );

    // 2. Insert wallet transaction
    await query(
      'INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, numericAmount, 'credit', desc]
    );

    // Fetch updated balance
    const updatedUser = await query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    const walletBalance = parseFloat(updatedUser.rows[0].wallet_balance);

    // Insert notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Wallet Top-up Success', $2, 'wallet')`,
      [userId, `Successfully topped up $${numericAmount.toFixed(2)} to your wallet balance.`]
    );

    res.status(200).json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        walletBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error topping up wallet',
      error: error.message,
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }

  try {
    const listRes = await query(
      `SELECT id, title, message, type, is_read as "isRead", created_at as "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: listRes.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  const { notificationId } = req.body;

  if (!notificationId) {
    res.status(400).json({ success: false, message: 'notificationId is required' });
    return;
  }

  try {
    const updateRes = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [notificationId]
    );

    if (updateRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error marking notification as read',
      error: error.message
    });
  }
};


