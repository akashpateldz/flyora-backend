import { Request, Response } from 'express';
import { usersTable, kycTable } from '../services/db.service';
import { KycSubmission } from '../types';

// Submit KYC Documents
export const submitKyc = async (req: Request, res: Response): Promise<void> => {
  const { userId, documentType, frontImage, backImage, selfieImage } = req.body;

  if (!userId || !documentType || !frontImage || !selfieImage) {
    res.status(400).json({
      success: false,
      message: 'All fields (userId, documentType, frontImage, selfieImage) are required',
    });
    return;
  }

  const user = usersTable.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found. Please complete signup first.',
    });
    return;
  }

  // Remove existing PENDING/REJECTED submission to allow resubmission
  const existingIndex = kycTable.findIndex(k => k.userId === userId);
  if (existingIndex !== -1) {
    if (kycTable[existingIndex].status === 'APPROVED') {
      res.status(400).json({
        success: false,
        message: 'Your KYC has already been approved and verified.',
      });
      return;
    }
    kycTable.splice(existingIndex, 1);
  }

  const newSubmission: KycSubmission = {
    userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    documentType,
    frontImage,
    backImage: backImage || '',
    selfieImage,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  };

  kycTable.push(newSubmission);

  res.status(201).json({
    success: true,
    message: 'KYC submitted successfully. Status is under review.',
    data: { status: 'PENDING' },
  });
};

// Check User KYC Status
export const getKycStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'userId is required',
    });
    return;
  }

  const submission = kycTable.find(k => k.userId === userId);
  if (!submission) {
    res.status(200).json({
      success: true,
      message: 'No KYC submission found',
      data: { status: 'NOT_SUBMITTED' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'KYC status retrieved successfully',
    data: {
      status: submission.status,
      rejectionReason: submission.rejectionReason,
    },
  });
};

// Admin: List all submissions
export const getAdminList = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Admin list retrieved successfully',
    data: kycTable,
  });
};

// Admin: Approve or Reject a submission
export const adminAction = async (req: Request, res: Response): Promise<void> => {
  const { userId, action, reason } = req.body;

  if (!userId || !action || !['APPROVE', 'REJECT'].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'userId and action (APPROVE or REJECT) are required',
    });
    return;
  }

  const submission = kycTable.find(k => k.userId === userId);
  if (!submission) {
    res.status(404).json({
      success: false,
      message: 'KYC submission not found for review',
    });
    return;
  }

  if (action === 'APPROVE') {
    submission.status = 'APPROVED';
    submission.rejectionReason = undefined;
  } else {
    submission.status = 'REJECTED';
    submission.rejectionReason = reason || 'Documents did not meet criteria.';
  }

  submission.reviewedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: `KYC has been successfully ${submission.status.toLowerCase()}`,
    data: {
      userId,
      status: submission.status,
      rejectionReason: submission.rejectionReason,
    },
  });
};
