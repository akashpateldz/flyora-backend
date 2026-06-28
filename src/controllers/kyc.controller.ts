import { Request, Response } from 'express';
import { query } from '../services/db.service';

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

  try {
    // Check if user exists
    const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userRes.rowCount || userRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found. Please complete signup first.',
      });
      return;
    }

    // Check existing submissions
    const existingRes = await query(
      'SELECT status FROM kyc_submissions WHERE user_id = $1',
      [userId]
    );

    if (existingRes.rowCount && existingRes.rowCount > 0) {
      const submission = existingRes.rows[0];
      if (submission.status === 'APPROVED') {
        res.status(400).json({
          success: false,
          message: 'Your KYC has already been approved and verified.',
        });
        return;
      }
      // Delete existing PENDING/REJECTED submission to allow resubmission
      await query('DELETE FROM kyc_submissions WHERE user_id = $1', [userId]);
    }

    // Insert new submission
    await query(
      `INSERT INTO kyc_submissions (user_id, document_type, front_image_url, back_image_url, selfie_image_url, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [userId, documentType, frontImage, backImage || null, selfieImage]
    );

    // Update user's KYC status to PENDING
    await query(
      "UPDATE users SET kyc_status = 'PENDING' WHERE id = $1",
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. Status is under review.',
      data: { status: 'PENDING' },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error during KYC submission',
      error: error.message,
    });
  }
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

  try {
    const resubmission = await query(
      'SELECT status, rejection_reason FROM kyc_submissions WHERE user_id = $1',
      [userId]
    );

    if (!resubmission.rowCount || resubmission.rowCount === 0) {
      res.status(200).json({
        success: true,
        message: 'No KYC submission found',
        data: { status: 'NOT_SUBMITTED' },
      });
      return;
    }

    const sub = resubmission.rows[0];
    res.status(200).json({
      success: true,
      message: 'KYC status retrieved successfully',
      data: {
        status: sub.status,
        rejectionReason: sub.rejection_reason || undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving KYC status',
      error: error.message,
    });
  }
};

// Admin: List all submissions
export const getAdminList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const listRes = await query(
      `SELECT
         k.id,
         k.user_id as "userId",
         u.full_name as "fullName",
         u.email,
         u.phone,
         k.document_type as "documentType",
         k.front_image_url as "frontImage",
         k.back_image_url as "backImage",
         k.selfie_image_url as "selfieImage",
         k.status,
         k.rejection_reason as "rejectionReason",
         k.submitted_at as "submittedAt"
       FROM kyc_submissions k
       JOIN users u ON k.user_id = u.id
       ORDER BY k.submitted_at DESC`
    );

    res.status(200).json({
      success: true,
      message: 'Admin list retrieved successfully',
      data: listRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving KYC admin list',
      error: error.message,
    });
  }
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

  try {
    const submissionRes = await query(
      'SELECT id FROM kyc_submissions WHERE user_id = $1',
      [userId]
    );

    if (!submissionRes.rowCount || submissionRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'KYC submission not found for review',
      });
      return;
    }

    const statusValue = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const reasonValue = action === 'APPROVE' ? null : (reason || 'Documents did not meet criteria.');

    // Update submission
    await query(
      `UPDATE kyc_submissions
       SET status = $1, rejection_reason = $2, reviewed_at = NOW()
       WHERE user_id = $3`,
      [statusValue, reasonValue, userId]
    );

    // Update user
    await query(
      `UPDATE users
       SET kyc_status = $1
       WHERE id = $2`,
      [statusValue, userId]
    );

    res.status(200).json({
      success: true,
      message: `KYC has been successfully ${statusValue.toLowerCase()}`,
      data: {
        userId,
        status: statusValue,
        rejectionReason: reasonValue || undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin KYC action',
      error: error.message,
    });
  }
};
