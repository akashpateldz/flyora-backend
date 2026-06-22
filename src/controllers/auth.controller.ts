import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { usersTable } from '../services/db.service';
import { User } from '../types';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    res.status(400).json({
      success: false,
      message: 'All fields (fullName, email, phone, password) are required',
    });
    return;
  }

  const existingUser = usersTable.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'Email address is already registered',
    });
    return;
  }

  const newUser: User = {
    id: uuidv4(),
    fullName,
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    createdAt: new Date().toISOString(),
  };

  usersTable.push(newUser);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      userId: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  const user = usersTable.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || user.password !== password) {
    res.status(401).json({
      success: false,
      message: 'Invalid email address or password',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};
