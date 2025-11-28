import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import prisma from '../config/database';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
const callerId = process.env.TWILIO_PHONE_NUMBER;

/**
 * Generate Twilio Access Token for WebRTC calling
 */
export const generateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      return next(
        createError('Twilio configuration is missing. Please configure Twilio credentials.', 500)
      );
    }

    // Create a unique identity for the user
    const identity = `user_${req.user.userId}`;

    // Create access token
    const token = new AccessToken(accountSid!, apiKey!, apiSecret!, {
      identity,
    });

    // Grant voice permissions
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    res.json({
      success: true,
      data: {
        token: token.toJwt(),
        identity,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handle outgoing call - create TwiML
 */
export const makeCall = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { to, from, guestId } = req.body;

    if (!to) {
      return next(createError('Phone number is required', 400));
    }

    if (!callerId) {
      return next(createError('Twilio phone number is not configured', 500));
    }

    const twiml = new twilio.twiml.VoiceResponse();

    // Dial the number
    const dial = twiml.dial({
      callerId: callerId,
      record: 'record-from-answer',
      recordingStatusCallback: `${process.env.API_URL || 'http://localhost:5000'}/api/twilio/recording-status`,
      recordingStatusCallbackEvent: ['completed'],
    });

    dial.number(to);

    // Log the call
    try {
      await prisma.callHistory.create({
        data: {
          userId: req.user.userId,
          guestId: guestId || null,
          phoneNumber: to,
          direction: 'outbound',
          status: 'initiated',
          startedAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to log call:', dbError);
      // Don't fail the call if logging fails
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handle incoming call - create TwiML
 */
export const receiveCall = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { From, To } = req.body;

    const twiml = new twilio.twiml.VoiceResponse();

    // For now, just say a greeting
    twiml.say(
      {
        voice: 'alice',
        language: 'en-US',
      },
      'Thank you for calling. Please hold while we connect you.'
    );

    // You can add more logic here to route the call
    // For example, dial a specific number or extension

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handle call status updates
 */
export const callStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { CallSid, CallStatus, From, To, Direction, Duration } = req.body;

    // Update call history
    try {
      const callHistory = await prisma.callHistory.findFirst({
        where: {
          phoneNumber: Direction === 'outbound-api' ? To : From,
          status: 'initiated',
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (callHistory) {
        await prisma.callHistory.update({
          where: { id: callHistory.id },
          data: {
            callSid: CallSid,
            status: CallStatus === 'completed' ? 'completed' : CallStatus,
            duration: Duration ? parseInt(Duration) : null,
            endedAt: CallStatus === 'completed' || CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'failed' ? new Date() : null,
          },
        });
      }
    } catch (dbError) {
      console.error('Failed to update call status:', dbError);
    }

    res.status(200).send('OK');
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handle recording status updates
 */
export const recordingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { CallSid, RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration } = req.body;

    // Update call history with recording info
    try {
      const callHistory = await prisma.callHistory.findFirst({
        where: {
          callSid: CallSid,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (callHistory && RecordingStatus === 'completed') {
        await prisma.callHistory.update({
          where: { id: callHistory.id },
          data: {
            recordingSid: RecordingSid,
            recordingUrl: RecordingUrl,
            recordingDuration: RecordingDuration ? parseInt(RecordingDuration) : null,
          },
        });
      }
    } catch (dbError) {
      console.error('Failed to update recording status:', dbError);
    }

    res.status(200).send('OK');
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get call history
 */
export const getCallHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { guestId, limit = 50, offset = 0 } = req.query;

    const where: any = {
      userId: req.user.userId,
    };

    if (guestId) {
      where.guestId = guestId as string;
    }

    const [calls, total] = await Promise.all([
      prisma.callHistory.findMany({
        where,
        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.callHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        calls,
        total,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

