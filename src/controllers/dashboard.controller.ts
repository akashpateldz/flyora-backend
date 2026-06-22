import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { usersTable, tripsTable, shipmentsTable } from '../services/db.service';
import { Trip, Shipment } from '../types';

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

  const user = usersTable.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  const newTrip: Trip = {
    id: uuidv4(),
    userId,
    fullName: user.fullName,
    fromCity: fromCity.trim(),
    toCity: toCity.trim(),
    travelDate,
    availableWeight: Number(availableWeight),
    pricePerKg: Number(pricePerKg),
    description: description ? description.trim() : undefined,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  tripsTable.push(newTrip);

  res.status(201).json({
    success: true,
    message: 'Trip registered successfully',
    data: newTrip,
  });
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

  const trips = tripsTable.filter(t => t.userId === userId);
  
  // Sort by date descending
  trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.status(200).json({
    success: true,
    message: 'User trips retrieved successfully',
    data: trips,
  });
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

  const user = usersTable.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  const newShipment: Shipment = {
    id: uuidv4(),
    userId,
    fullName: user.fullName,
    title: title.trim(),
    fromCity: fromCity.trim(),
    toCity: toCity.trim(),
    deliveryDeadline,
    weight: Number(weight),
    pricePaid: Number(pricePaid),
    category,
    description: description.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  shipmentsTable.push(newShipment);

  res.status(201).json({
    success: true,
    message: 'Shipment request created successfully',
    data: newShipment,
  });
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

  const shipments = shipmentsTable.filter(s => s.userId === userId);
  
  // Sort by date descending
  shipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.status(200).json({
    success: true,
    message: 'User shipments retrieved successfully',
    data: shipments,
  });
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

  const user = usersTable.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Active records counts
  const activeTrips = tripsTable.filter(t => t.userId === userId && t.status === 'ACTIVE');
  const activeShipments = shipmentsTable.filter(s => s.userId === userId && s.status === 'PENDING');

  // Dynamic matching:
  // 1. Matches for this user's active trips: find pending shipments by other users between same cities
  const travelMatches: any[] = [];
  activeTrips.forEach(trip => {
    const matchingShipments = shipmentsTable.filter(ship => 
      ship.userId !== userId &&
      ship.status === 'PENDING' &&
      ship.fromCity.toLowerCase().trim() === trip.fromCity.toLowerCase().trim() &&
      ship.toCity.toLowerCase().trim() === trip.toCity.toLowerCase().trim()
    );
    
    matchingShipments.forEach(ship => {
      travelMatches.push({
        tripId: trip.id,
        tripDetails: `${trip.fromCity} ➔ ${trip.toCity} (${new Date(trip.travelDate).toLocaleDateString()})`,
        matchType: 'shipment_match',
        shipment: ship
      });
    });
  });

  // 2. Matches for this user's pending shipments: find active trips by other users between same cities
  const shipmentMatches: any[] = [];
  activeShipments.forEach(shipment => {
    const matchingTrips = tripsTable.filter(trip => 
      trip.userId !== userId &&
      trip.status === 'ACTIVE' &&
      trip.fromCity.toLowerCase().trim() === shipment.fromCity.toLowerCase().trim() &&
      trip.toCity.toLowerCase().trim() === shipment.toCity.toLowerCase().trim()
    );

    matchingTrips.forEach(trip => {
      shipmentMatches.push({
        shipmentId: shipment.id,
        shipmentDetails: `${shipment.title} (${shipment.weight}kg)`,
        matchType: 'traveler_match',
        trip: trip
      });
    });
  });

  // Simulated Escrow & Wallet data
  // Base balance of $380.00
  // Escrow balance: sum of active shipments pricePaid.
  const walletBalance = 380.00;
  const escrowBalance = activeShipments.reduce((sum, s) => sum + s.pricePaid, 0);

  res.status(200).json({
    success: true,
    message: 'Dashboard overview data loaded',
    data: {
      stats: {
        activeTripsCount: activeTrips.length,
        activeShipmentsCount: activeShipments.length,
        walletBalance,
        escrowBalance,
      },
      matches: {
        travelMatches,
        shipmentMatches,
        totalMatchesCount: travelMatches.length + shipmentMatches.length
      }
    }
  });
};

// Update User Profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { fullName, email, phone, password } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

  const user = usersTable.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // If email is being changed, check uniqueness
  if (email && email.toLowerCase().trim() !== user.email) {
    const emailTaken = usersTable.some(u => u.id !== userId && u.email === email.toLowerCase().trim());
    if (emailTaken) {
      res.status(400).json({
        success: false,
        message: 'This email address is already taken by another user',
      });
      return;
    }
    user.email = email.toLowerCase().trim();
  }

  if (fullName) {
    user.fullName = fullName.trim();
    // Cascade update name in creator fields
    tripsTable.forEach(t => {
      if (t.userId === userId) t.fullName = user.fullName;
    });
    shipmentsTable.forEach(s => {
      if (s.userId === userId) s.fullName = user.fullName;
    });
  }

  if (phone) {
    user.phone = phone.trim();
  }

  if (password) {
    user.password = password;
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    }
  });
};
