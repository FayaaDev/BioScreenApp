import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertScreeningSchema, insertUserScreeningSchema, insertFamilyMemberSchema, insertFamilyMemberScreeningSchema, educationalContent, insertEducationalContentSchema } from "@shared/schema";
import { z } from "zod";
import { db, adminUsers } from './db';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import WhatsAppService from './whatsappService';
// Notifications disabled for next update
// import NotificationScheduler from './notificationScheduler';

// Dummy NotificationScheduler for backwards compatibility
class NotificationScheduler {
  static getInstance() {
    return new NotificationScheduler();
  }
  
  async initialize() {
    console.log('📵 Notifications disabled - scheduler not initialized');
  }
  
  async scheduleScreeningReminder(...args: any[]) {
    console.log('📵 Notifications disabled - screening reminder not scheduled');
    return 'disabled';
  }
  
  async scheduleFamilyMemberScreeningReminder(...args: any[]) {
    console.log('📵 Notifications disabled - family member reminder not scheduled');
    return 'disabled';
  }
}

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for icon uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: './public/icons/',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Initialize storage
  await storage.initializeDefaultScreenings();

  // Initialize WhatsApp service
  const whatsappService = WhatsAppService.getInstance();
  const twilioConfig = {
    apiUrl: process.env.TWILIO_API_URL || 'https://api.twilio.com',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
  };
  
  if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.whatsappNumber) {
    whatsappService.initialize(twilioConfig);
    console.log('✅ Twilio WhatsApp service initialized');
  } else {
    console.log('⚠️ Twilio WhatsApp service not initialized - missing credentials');
  }

  // Initialize notification scheduler
  const notificationScheduler = NotificationScheduler.getInstance();
  await notificationScheduler.initialize();
  console.log('✅ Notification scheduler initialized');

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin authentication middleware
  const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; username: string };
      
      // Verify admin exists
      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.id, decoded.id)
      });

      if (!admin) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      server: 'BioScreen API'
    });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.username, username)
      });

      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await db.update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, admin.id));

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ 
        token,
        user: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User login endpoint
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Normalize email: trim whitespace, convert to lowercase, remove RTL markers
      const normalizedEmail = email
        .trim()
        .toLowerCase()
        .replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // Remove RTL/LTR marks

      console.log(`[Login] Attempting login for email: ${normalizedEmail}`);

      // Find user by normalized email
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        console.log(`[Login] User not found for email: ${normalizedEmail}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token for user
      const token = jwt.sign(
        { id: user.id, email: user.email, isAdmin: user.isAdmin || false },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin || false,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender
        }
      });
    } catch (error) {
      console.error('User login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.id, req.user!.id)
      });

      if (!admin) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: admin.id,
        username: admin.username,
        lastLogin: admin.lastLogin
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Icon upload endpoint
  app.post("/api/upload-icon", upload.single('icon'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const iconUrl = `/icons/${req.file.filename}`;
      res.json({ iconUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload icon" });
    }
  });

  // Create user profile
  app.post("/api/users", async (req, res) => {
    try {
      // Normalize email: trim whitespace, convert to lowercase, remove RTL markers
      const normalizedEmail = req.body.email
        ? req.body.email.trim().toLowerCase().replace(/[\u200E\u200F\u202A-\u202E]/g, '')
        : req.body.email;
      
      // Map nested fields to flat fields
      const mappedBody = {
        ...req.body,
        email: normalizedEmail,
        smokingAmount: req.body.smokingDetails?.amount,
        smokingDuration: req.body.smokingDetails?.duration,
        sexualPartnerCount: req.body.sexualActivityDetails?.partnerCount,
      };

      const userData = insertUserSchema.parse(mappedBody);
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password || "temp_password", 10);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userDataWithHashedPassword);
      
      // Generate initial screenings for the user
      const screenings = await storage.getScreenings();
      const userAge = new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear();
      
      for (const screening of screenings) {
        // Check if screening applies to this user's gender and age range
        const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === userData.gender;
        const withinAgeRange = screening.endAge === null || userAge <= screening.endAge;
        
        // Skip SMK screenings for non-smokers
          if (screening.specialCode === "SMK" && !userData.isSmoker) {
            continue;
          }

          // Skip PRG screenings for non-Pregnant women
          if (screening.specialCode === "PRG" && !userData.isPregnant) {
            continue;
          }

          // Skip STD screenings (STD)for partners with a single spouse.
          if (screening.specialCode === "SEX" && userData.sexualPartnerCount === "single") {
            continue;
          }

          // Skip Diabetes screening (BMI_DM) for users with BMI <= 24.9
          if (screening.specialCode === "BMI_DM" && userData.height && userData.weight) {
            const userBMI = (parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2));
            if (userBMI <= 24.9) {
              continue;
            }
          }

          // Skip Lung Cancer screening (LungCa) for non-smokers or non-heavy smokers
          if (
            screening.specialCode === "LungCa" &&
            (
              userData.isSmoker === false || // Skip if user is a non-smoker
              !userData.smokingAmount ||
              !userData.smokingDuration ||
              (parseFloat(userData.smokingAmount) * parseFloat(userData.smokingDuration) < 20)
            )
          ) {
            continue;
          }

          // Skip Heart screening (RF) for medically free users.
          if (
            screening.specialCode === "RF" &&
            !userData.isDiabetic &&
            !userData.isHypertensive &&
            !userData.isCholesterol &&
            !userData.isSmoker
          ) {
            continue;
          }

          // Skip Obesity screening for users with BMI <= 29.9
          if (screening.specialCode === "BMI_OB" && userData.height && userData.weight) {
            const userBMI = (parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2));
            if (userBMI <= 29.9) {
              continue;
            }
          }
        

        
        if (genderMatches && withinAgeRange) {
          // Calculate next due date - always set to January of the target year
          const birthDate = new Date(userData.dateOfBirth);
          const birthYear = birthDate.getFullYear();
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1; // 1-based month
          
          // Calculate the year when user turns the start age
          const targetYear = birthYear + screening.startAge;
          const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
          
          // Determine status based on current date vs target date
          let status: "due" | "overdue" | "later";
          
          if (currentYear < targetYear) {
            // Before the target year - always "later"
            status = "later";
          } else if (currentYear === targetYear || currentYear === targetYear + 1) {
            // User is AT StartAge or exactly one year past - "due"
            status = "due";
          } else {
            // More than one year past start age - "overdue"
            status = "overdue";
          }
          
          await storage.createUserScreening({
            userId: user.id,
            screeningId: screening.id,
            lastCompleted: null,
            nextDue: nextDue.toISOString(),
            status: status
          });
          
          // Schedule WhatsApp reminder if user has phone number and screening is due
          if (userData.phoneNumber && status === "due") {
            try {
              const notificationScheduler = NotificationScheduler.getInstance();
              const jobId = await notificationScheduler.scheduleScreeningReminder(
                user.id,
                screening.id,
                nextDue,
                7 // 7 days before due date
              );
              console.log(`✅ Scheduled WhatsApp reminder for new user ${userData.name} - ${screening.name} (Job ID: ${jobId})`);
            } catch (error) {
              console.error('Error scheduling WhatsApp reminder for new user screening:', error);
            }
          }
        }
      }
      
      // Send welcome message if phone number is provided
      if (userData.phoneNumber) {
        try {
          const whatsappService = WhatsAppService.getInstance();
          const welcomeSuccess = await whatsappService.sendWelcomeMessage(
            userData.phoneNumber,
            userData.name
          );
          
          if (welcomeSuccess) {
            console.log(`✅ Welcome message sent to new user: ${userData.name} (${userData.phoneNumber})`);
          } else {
            console.log(`⚠️ Failed to send welcome message to: ${userData.name} (${userData.phoneNumber})`);
          }
        } catch (error) {
          console.error('Error sending welcome message during user creation:', error);
        }
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Normalize email if provided
      const normalizedUpdates = { ...req.body };
      if (normalizedUpdates.email) {
        normalizedUpdates.email = normalizedUpdates.email
          .trim()
          .toLowerCase()
          .replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // Remove RTL/LTR marks
      }
      
      const updates = insertUserSchema.partial().parse(normalizedUpdates);
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      // Send welcome message if phone number is being added or updated
      if (updates.phoneNumber && updates.phoneNumber !== user.phoneNumber) {
        try {
          const whatsappService = WhatsAppService.getInstance();
          const welcomeSuccess = await whatsappService.sendWelcomeMessage(
            updates.phoneNumber,
            user.name
          );
          
          if (welcomeSuccess) {
            console.log(`✅ Welcome message sent to updated user: ${user.name} (${updates.phoneNumber})`);
          } else {
            console.log(`⚠️ Failed to send welcome message to: ${user.name} (${updates.phoneNumber})`);
          }
          
          // Schedule WhatsApp reminders for existing due screenings
          const userScreenings = await storage.getUserScreenings(user.id);
          const notificationScheduler = NotificationScheduler.getInstance();
          
          for (const userScreening of userScreenings) {
            if (userScreening.status === "due") {
              try {
                const jobId = await notificationScheduler.scheduleScreeningReminder(
                  user.id,
                  userScreening.screeningId,
                  new Date(userScreening.nextDue),
                  7 // 7 days before due date
                );
                console.log(`✅ Scheduled WhatsApp reminder for updated user ${user.name} - Screening ID ${userScreening.screeningId} (Job ID: ${jobId})`);
              } catch (error) {
                console.error(`Error scheduling WhatsApp reminder for user screening ${userScreening.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Error sending welcome message during user update:', error);
        }
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get user with their screenings
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const userScreenings = await storage.getUserScreenings(userId);
      const allScreenings = await storage.getScreenings();
      
      // Calculate user age for status determination
      const userAge = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
      
      // Check for new screenings based on current age
      for (const screening of allScreenings) {
        // Skip if user already has this screening
        if (userScreenings.some(us => us.screeningId === screening.id && us.status !== 'completed')) {
          continue;
        }

        // Skip if this is a one-time test (frequencyYears === 0) and user already has it (completed or not)
        if (screening.frequencyYears === 0 && userScreenings.some(us => us.screeningId === screening.id)) {
          continue;
        }

        // Check if screening applies to this user's gender and age range
        const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === user.gender;
        const withinAgeRange = screening.endAge === null || userAge <= screening.endAge;
        
        // Apply special conditions (same as in user creation)
        if (screening.specialCode === "SMK" && !user.isSmoker) continue;
        if (screening.specialCode === "PRG" && !user.isPregnant) continue;
        if (screening.specialCode === "SEX" && user.sexualPartnerCount === "single") continue;
        if (screening.specialCode === "BMI_DM" && user.height && user.weight) {
          const userBMI = (parseFloat(user.weight) / Math.pow(parseFloat(user.height) / 100, 2));
          if (userBMI <= 24.9) continue;
        }
        if (screening.specialCode === "LungCa" && (!user.isSmoker || !user.smokingAmount || !user.smokingDuration || 
            (parseFloat(user.smokingAmount) * parseFloat(user.smokingDuration) < 20))) continue;
        if (screening.specialCode === "RF" && !user.isDiabetic && !user.isHypertensive && 
            !user.isCholesterol && !user.isSmoker) continue;
        if (screening.specialCode === "BMI_OB" && user.height && user.weight) {
          const userBMI = (parseFloat(user.weight) / Math.pow(parseFloat(user.height) / 100, 2));
          if (userBMI <= 29.9) continue;
        }

        if (genderMatches && withinAgeRange) {
          // Calculate next due date
          const birthDate = new Date(user.dateOfBirth);
          const birthYear = birthDate.getFullYear();
          const currentYear = new Date().getFullYear();
          
          // Calculate the year when user turns the start age
          const targetYear = birthYear + screening.startAge;
          const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
          
          // Determine status based on current date vs target date
          let status: "due" | "overdue" | "later";
          
          if (currentYear < targetYear) {
            status = "later";
          } else if (currentYear === targetYear || currentYear === targetYear + 1) {
            status = "due";
          } else {
            status = "overdue";
          }
          
          // Create new screening for user
          await storage.createUserScreening({
            userId: user.id,
            screeningId: screening.id,
            lastCompleted: null,
            nextDue: nextDue.toISOString(),
            status: status
          });
        }
      }

      // Get updated screenings after adding new ones
      const updatedUserScreenings = await storage.getUserScreenings(userId);
      
      // Calculate status for all screenings
      const screeningsWithDetails = await Promise.all(updatedUserScreenings.map(async us => {
        const screening = allScreenings.find(s => s.id === us.screeningId);
        // Dynamically calculate status if not completed
        let status = us.status;
        if (status !== "completed" && screening) {
          // Preserve 'laterRecreated' status for repeatable screenings
          if (status === "laterRecreated") {
            // Do not overwrite, just return as is
            return {
              ...us,
              status,
              screening
            };
          }
          const now = new Date();
          // For repeatable screenings, use nextDue date to determine status
          if (screening.frequencyYears > 0) {
            const nextDue = new Date(us.nextDue);
            const oneYearAfterNextDue = new Date(nextDue);
            oneYearAfterNextDue.setFullYear(nextDue.getFullYear() + 1);
            if (now < nextDue) {
              status = "later";
            } else if (now >= nextDue && now < oneYearAfterNextDue) {
              status = "due";
            } else {
              status = "overdue";
            }
          } else {
            // For non-repeatable screenings, use the original age-based logic
            const birthDate = new Date(user.dateOfBirth);
            const birthYear = birthDate.getFullYear();
            const currentYear = now.getFullYear();
            const targetYear = birthYear + screening.startAge;
            if (currentYear < targetYear) {
              status = "later";
            } else if (currentYear === targetYear || currentYear === targetYear + 1) {
              status = "due";
            } else {
              status = "overdue";
            }
          }
          // Update the screening status in the database if it has changed
          if (status !== us.status) {
            await storage.updateUserScreening(us.id, {
              status: status,
              nextDue: us.nextDue // Keep the existing nextDue date
            });
          }
        }
        return {
          ...us,
          status,
          screening
        };
      }));

      res.json({
        user,
        screenings: screeningsWithDetails
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Family member routes
  
  // Get family members for a user
  app.get("/api/users/:userId/family", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const familyMembers = await storage.getFamilyMembers(userId);
      res.json(familyMembers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a family member
  app.post("/api/users/:userId/family", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Map nested fields to flat fields for smoking and sexual activity
      const mappedBody = {
        ...req.body,
        smokingAmount: req.body.smokingDetails?.amount,
        smokingDuration: req.body.smokingDetails?.duration,
        sexualPartnerCount: req.body.sexualActivityDetails?.partnerCount,
        userId
      };
      const familyMemberData = insertFamilyMemberSchema.parse(mappedBody);
      const familyMember = await storage.createFamilyMember(familyMemberData);
      
      // Send welcome message if phone number is provided
      if (familyMemberData.phoneNumber) {
        try {
          const whatsappService = WhatsAppService.getInstance();
          const welcomeSuccess = await whatsappService.sendWelcomeMessage(
            familyMemberData.phoneNumber,
            familyMemberData.name
          );
          
          if (welcomeSuccess) {
            console.log(`✅ Welcome message sent to new family member: ${familyMemberData.name} (${familyMemberData.phoneNumber})`);
          } else {
            console.log(`⚠️ Failed to send welcome message to family member: ${familyMemberData.name} (${familyMemberData.phoneNumber})`);
          }

          // Schedule WhatsApp reminders for existing due screenings
          // First, we need to generate the screenings by calling the screening calculation logic
          try {
            // Get all screenings to calculate which ones apply to this family member
            const allScreenings = await storage.getScreenings();
            
            // Calculate age and applicable screenings (similar to /api/family/:id/screenings logic)
            const memberAge = new Date().getFullYear() - new Date(familyMember.dateOfBirth).getFullYear();
            
            const applicableScreenings = allScreenings.filter(screening => {
              const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === familyMember.gender;
              
              // Skip SMK screenings for non-smokers
              if (screening.specialCode === "SMK" && !familyMember.isSmoker) {
                return false;
              }

              // Skip Diabetes screening (BMI_DM) for users with BMI <= 24.9
              if (screening.specialCode === "BMI_DM" && familyMember.height && familyMember.weight) {
                const memberBMI = (parseFloat(familyMember.weight) / Math.pow(parseFloat(familyMember.height) / 100, 2));
                if (memberBMI <= 24.9) {
                  return false;
                }
              }

              // Skip screenings beyond end age
              if (screening.endAge !== null && memberAge > screening.endAge) {
                return false;
              }
              
              return genderMatches;
            });

            const notificationScheduler = NotificationScheduler.getInstance();
            
            // Check each applicable screening for "due" status
            for (const screening of applicableScreenings) {
              const birthDate = new Date(familyMember.dateOfBirth);
              const birthYear = birthDate.getFullYear();
              const currentYear = new Date().getFullYear();
              const targetYear = birthYear + screening.startAge;
              
              let status: "due" | "overdue" | "later";
              
              if (currentYear < targetYear) {
                status = "later";
              } else if (currentYear === targetYear || currentYear === targetYear + 1) {
                status = "due";
              } else {
                status = "overdue";
              }
              
              // Schedule reminder if status is "due"
              if (status === "due") {
                try {
                  const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
                  const jobId = await notificationScheduler.scheduleFamilyMemberScreeningReminder(
                    familyMember.id,
                    screening.id,
                    nextDue,
                    7 // 7 days before due date
                  );
                  console.log(`✅ Scheduled WhatsApp reminder for new family member ${familyMemberData.name} - Screening: ${screening.name} (Job ID: ${jobId})`);
                } catch (error) {
                  console.error(`Error scheduling WhatsApp reminder for screening ${screening.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error('Error calculating and scheduling screening reminders:', error);
          }
        } catch (error) {
          console.error('Error sending welcome message during family member creation:', error);
        }
      }
      
      res.json(familyMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid family member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Update a family member
  app.patch("/api/family/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Map nested fields to flat fields for smoking and sexual activity
      const mappedBody = {
        ...req.body,
        smokingAmount: req.body.smokingDetails?.amount,
        smokingDuration: req.body.smokingDetails?.duration,
        sexualPartnerCount: req.body.sexualActivityDetails?.partnerCount,
      };
      const updates = insertFamilyMemberSchema.partial().parse(mappedBody);
      
      // Get original family member to compare phone numbers
      const originalFamilyMember = await storage.getFamilyMember(id);
      
      const familyMember = await storage.updateFamilyMember(id, updates);
      if (!familyMember) {
        res.status(404).json({ message: "Family member not found" });
        return;
      }
      
      // Send welcome message if phone number is being added or updated
      if (updates.phoneNumber && originalFamilyMember && updates.phoneNumber !== originalFamilyMember.phoneNumber) {
        try {
          const whatsappService = WhatsAppService.getInstance();
          const welcomeSuccess = await whatsappService.sendWelcomeMessage(
            updates.phoneNumber,
            familyMember.name
          );
          
          if (welcomeSuccess) {
            console.log(`✅ Welcome message sent to updated family member: ${familyMember.name} (${updates.phoneNumber})`);
          } else {
            console.log(`⚠️ Failed to send welcome message to family member: ${familyMember.name} (${updates.phoneNumber})`);
          }
          
          // Schedule WhatsApp reminders for existing due screenings
          const familyScreenings = await storage.getFamilyMemberScreenings(id);
          const notificationScheduler = NotificationScheduler.getInstance();
          
          for (const familyScreening of familyScreenings) {
            if (familyScreening.status === "due") {
              try {
                const jobId = await notificationScheduler.scheduleFamilyMemberScreeningReminder(
                  id,
                  familyScreening.screeningId,
                  new Date(familyScreening.nextDue),
                  7 // 7 days before due date
                );
                console.log(`✅ Scheduled WhatsApp reminder for updated family member ${familyMember.name} - Screening ID ${familyScreening.screeningId} (Job ID: ${jobId})`);
              } catch (error) {
                console.error(`Error scheduling WhatsApp reminder for family screening ${familyScreening.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Error sending welcome message during family member update:', error);
        }
      }
      
      res.json(familyMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid family member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Delete a family member
  app.delete("/api/family/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFamilyMember(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Family member not found" });
        return;
      }
      
      res.json({ message: "Family member deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get family member screenings (calculate screenings for a family member)
  app.get("/api/family/:id/screenings", async (req, res) => {
    try {
      const familyMemberId = parseInt(req.params.id);
      
      // Get the family member first
      const familyMember = await storage.getFamilyMember(familyMemberId);
      
      if (!familyMember) {
        res.status(404).json({ message: "Family member not found" });
        return;
      }
      
      // Get all available screenings
      const allScreenings = await storage.getScreenings();
      
      // Get existing family member screening records
      const existingFamilyScreenings = await storage.getFamilyMemberScreenings(familyMemberId);
      
      // Calculate age
      const memberAge = new Date().getFullYear() - new Date(familyMember.dateOfBirth).getFullYear();
      
      // Filter and calculate appropriate screenings
      const applicableScreenings = allScreenings.filter(screening => {
        const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === familyMember.gender;
        
        // Skip SMK screenings for non-smokers
        if (screening.specialCode === "SMK" && !familyMember.isSmoker) {
          return false;
        }

        // Skip Diabetes screening (BMI_DM) for users with BMI <= 24.9
        if (screening.specialCode === "BMI_DM" && familyMember.height && familyMember.weight) {
          const memberBMI = (parseFloat(familyMember.weight) / Math.pow(parseFloat(familyMember.height) / 100, 2));
          if (memberBMI <= 24.9) {
            return false;
          }
        }

        // Skip Obesity screening for users with BMI <= 29.9
        if (screening.specialCode === "BMI_OB" && familyMember.height && familyMember.weight) {
          const memberBMI = (parseFloat(familyMember.weight) / Math.pow(parseFloat(familyMember.height) / 100, 2));
          if (memberBMI <= 29.9) {
            return false;
          }
        }
        
        // Skip PRG screenings for non-Pregnant women
        if (screening.specialCode === "PRG" && !familyMember.isPregnant) {
          return false;
        }

        // Skip STD screenings (STD)for partners with a single spouse.
        if (screening.specialCode === "SEX" && familyMember.sexualPartnerCount === "single") {
          return false;
        }

        // Skip Heart screening (RF) for medically free users.
        if (
          screening.specialCode === "RF" &&
          !familyMember.isDiabetic &&
          !familyMember.isHypertensive &&
          !familyMember.isCholesterol &&
          !familyMember.isSmoker
        ) {
          return false;
        }

        // Skip Lung Cancer screening (LungCa) for non-smokers or non-heavy smokers
        if (
          screening.specialCode === "LungCa" &&
          (
            familyMember.isSmoker === false || // Skip if user is a non-smoker
            !familyMember.smokingAmount ||
            !familyMember.smokingDuration ||
            (parseFloat(familyMember.smokingAmount) * parseFloat(familyMember.smokingDuration) < 20)
          )
        ) {
          return false;
        }
        
        // Include all gender-appropriate screenings regardless of age to show "later" screenings
        // We'll filter by age in the status calculation
        return genderMatches;
      }).map(screening => {
        // Check if there's an existing family member screening record
        const existingScreening = existingFamilyScreenings.find(fms => fms.screeningId === screening.id);
        
        if (existingScreening) {
          // Dynamically calculate status if not completed
          let status = existingScreening.status;
          if (status !== "completed") {
            // Preserve 'laterRecreated' status for repeatable screenings
            if (status === "laterRecreated") {
              // Do not overwrite, just return as is
              return {
                ...existingScreening,
                status,
                screening
              };
            }
            const now = new Date();
            
            // For repeatable screenings, use nextDue date to determine status
            if (screening.frequencyYears > 0) {
              const nextDue = new Date(existingScreening.nextDue);
              const oneYearAfterNextDue = new Date(nextDue);
              oneYearAfterNextDue.setFullYear(nextDue.getFullYear() + 1);
              
              if (now < nextDue) {
                status = "later";
              } else if (now >= nextDue && now < oneYearAfterNextDue) {
                status = "due";
              } else {
                status = "overdue";
              }
            } else {
              // For non-repeatable screenings, use the original age-based logic
              const birthDate = new Date(familyMember.dateOfBirth);
              const birthYear = birthDate.getFullYear();
              const currentYear = now.getFullYear();
              const targetYear = birthYear + screening.startAge;
              
              if (currentYear < targetYear) {
                status = "later";
              } else if (currentYear === targetYear || currentYear === targetYear + 1) {
                status = "due";
              } else {
                status = "overdue";
              }
            }

            // Update the screening status in the database if it has changed
            if (status !== existingScreening.status) {
              storage.updateFamilyMemberScreening(existingScreening.id, {
                status: status,
                nextDue: existingScreening.nextDue // Keep the existing nextDue date
              });
            }
          }

          // Return the existing screening record with full details
          return {
            id: existingScreening.id,
            userId: familyMember.userId,
            screeningId: screening.id,
            lastCompleted: existingScreening.lastCompleted,
            nextDue: existingScreening.nextDue,
            status: status,
            screening
          };
        }
        
        // Calculate status for family member (for screenings without records)
        const birthDate = new Date(familyMember.dateOfBirth);
        const birthYear = birthDate.getFullYear();
        const currentYear = new Date().getFullYear();
        
        // Calculate the year when family member turns the start age
        const targetYear = birthYear + screening.startAge;
        const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
        
        // Check if family member is beyond the end age (exclude these screenings)
        if (screening.endAge !== null && memberAge > screening.endAge) {
          return null; // Will be filtered out
        }
        
        // Determine status based on current date vs target date
        let status: "due" | "overdue" | "later";
        
        if (currentYear < targetYear) {
          status = "later";
        } else if (currentYear === targetYear || currentYear === targetYear + 1) {
          status = "due";
        } else {
          status = "overdue";
        }
        
        return {
          id: 0, // No user screening ID for family members without records
          userId: familyMember.userId,
          screeningId: screening.id,
          lastCompleted: null,
          nextDue: nextDue.toISOString(),
          status,
          screening
        };
      }).filter(screening => screening !== null); // Remove screenings beyond end age
      
      // Calculate BMI if height and weight are available
      let bmiInfo = null;
      if (familyMember.height && familyMember.weight) {
        const bmi = calculateBMI(parseFloat(familyMember.height), parseFloat(familyMember.weight));
        bmiInfo = {
          value: bmi,
          category: getBMICategory(bmi)
        };
      }

      res.json({
        familyMember,
        screenings: applicableScreenings,
        bmiInfo
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all available screenings (for admin)
  app.get("/api/screenings", async (req, res) => {
    try {
      const screenings = await storage.getScreenings();
      res.json(screenings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new screening (admin)
  app.post("/api/screenings", async (req, res) => {
    try {
      const screeningData = insertScreeningSchema.parse(req.body);
      const screening = await storage.createScreening(screeningData);
      
      // Assign new screening to existing users who meet the criteria
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        const userAge = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
        
        // Include users based on gender and age criteria
        // Include if: gender matches AND (user hasn't exceeded end age if it exists)
        if (
          (screening.genderApplicable === "both" || screening.genderApplicable === user.gender) &&
          (screening.endAge === null || userAge <= screening.endAge)
        ) {
          // Calculate next due date - always set to January of the target year
          const birthDate = new Date(user.dateOfBirth);
          const birthYear = birthDate.getFullYear();
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          
          // Calculate the year when user turns the start age
          const targetYear = birthYear + screening.startAge;
          const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
          
          // Determine status based on current date vs target date
          let status: "due" | "overdue" | "later";
          
          if (currentYear < targetYear) {
            // Before the target year - always "later"
            status = "later";
          } else if (currentYear === targetYear || currentYear === targetYear + 1) {
            // User is AT StartAge or exactly one year past - "due"
            status = "due";
          } else {
            // More than one year past start age - "overdue"
            status = "overdue";
          }
          
          await storage.createUserScreening({
            userId: user.id,
            screeningId: screening.id,
            lastCompleted: null,
            nextDue: nextDue.toISOString(),
            status: status
          });
        }
      }
      
      res.json(screening);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid screening data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Update screening (admin)
  app.put("/api/screenings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertScreeningSchema.partial().parse(req.body);
      const screening = await storage.updateScreening(id, updates);
      
      if (!screening) {
        res.status(404).json({ message: "Screening not found" });
        return;
      }
      
      res.json(screening);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid screening data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Delete screening (admin)
  app.delete("/api/screenings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteScreening(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Screening not found" });
        return;
      }
      
      res.json({ message: "Screening deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user screening status
  app.put("/api/user-screenings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertUserScreeningSchema.partial().parse(req.body);
      console.log(`[PUT /api/user-screenings/${id}] Received updates:`, updates);
      
      // Get the current screening to check frequency
      const currentScreening = await storage.getUserScreeningById(id);
      console.log(`[PUT /api/user-screenings/${id}] Current screening:`, currentScreening);
      if (!currentScreening) {
        console.log(`[PUT /api/user-screenings/${id}] User screening not found`);
        res.status(404).json({ message: "User screening not found" });
        return;
      }

      // Get the screening details to check frequency
      const screening = await storage.getScreening(currentScreening.screeningId);
      console.log(`[PUT /api/user-screenings/${id}] Screening details:`, screening);
      if (!screening) {
        console.log(`[PUT /api/user-screenings/${id}] Screening not found`);
        res.status(404).json({ message: "Screening not found" });
        return;
      }

      // Update the screening status in the database
      const updatedScreening = await storage.updateUserScreening(id, updates);
      console.log(`[PUT /api/user-screenings/${id}] Updated screening:`, updatedScreening);
      if (!updatedScreening) {
        console.log(`[PUT /api/user-screenings/${id}] User screening not found after update`);
        res.status(404).json({ message: "User screening not found" });
        return;
      }

      // If completing a screening and it has a frequency
      if (updates.status === 'completed' && screening.frequencyYears > 0) {
        // Check for existing future screening
        const existingScreenings = await storage.getUserScreenings(currentScreening.userId);
        const hasFutureScreening = existingScreenings.some(us => 
          us.screeningId === screening.id && 
          us.status === 'later' && 
          us.id !== id
        );

        if (hasFutureScreening) {
          console.log(`[PUT /api/user-screenings/${id}] Not creating repeatable screening: another future screening exists`);
          res.status(400).json({ 
            message: "You already have a future test scheduled. Please complete your current tests first.",
            error: "FUTURE_TEST_EXISTS"
          });
          return;
        }

        // Calculate the next due date based on the current date
        const nextDueDate = new Date();
        nextDueDate.setFullYear(nextDueDate.getFullYear() + screening.frequencyYears);

        console.log(`[PUT /api/user-screenings/${id}] Creating repeatable screening with nextDue: ${nextDueDate.toISOString()}, status: laterRecreated`);
        // Create the next screening with the calculated next due date
        const newScreening = await storage.createUserScreening({
          userId: currentScreening.userId,
          screeningId: screening.id,
          lastCompleted: null,
          nextDue: nextDueDate.toISOString(),
          status: "laterRecreated" // Set new screenings as "laterRecreated" for recreated tests
        });
        
        // Schedule WhatsApp reminder if user has phone number
        try {
          const user = await storage.getUser(currentScreening.userId);
          if (user && user.phoneNumber) {
            const notificationScheduler = NotificationScheduler.getInstance();
            const jobId = await notificationScheduler.scheduleScreeningReminder(
              currentScreening.userId,
              screening.id,
              nextDueDate,
              7 // 7 days before due date
            );
            console.log(`✅ Scheduled WhatsApp reminder for user ${user.name} - ${screening.name} (Job ID: ${jobId})`);
          }
        } catch (error) {
          console.error('Error scheduling WhatsApp reminder for user screening:', error);
        }
        
        // Delete the completed screening
        await storage.deleteUserScreening(id);
      } else if (updates.status === 'completed' && screening.frequencyYears === 0) {
        // For non-repeatable screenings, just mark as completed and don't create a new one
        console.log(`[PUT /api/user-screenings/${id}] Non-repeatable screening marked as completed, no new screening created`);
      }
      res.json(updatedScreening);
    } catch (error) {
      console.error(`[PUT /api/user-screenings/:id] Error:`, error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Mark family member screening as completed
  app.post("/api/family/:familyId/screenings/:screeningId/complete", async (req, res) => {
    try {
      const familyId = parseInt(req.params.familyId);
      const screeningId = parseInt(req.params.screeningId);
      const { lastCompleted, nextDue, status } = insertFamilyMemberScreeningSchema.partial().parse(req.body);
      
      // Get the family member to verify it exists
      const familyMember = await storage.getFamilyMember(familyId);
      if (!familyMember) {
        res.status(404).json({ message: "Family member not found" });
        return;
      }
      
      // Get the screening to verify it exists
      const screening = await storage.getScreening(screeningId);
      if (!screening) {
        res.status(404).json({ message: "Screening not found" });
        return;
      }

      // Get existing family member screening records
      const existingFamilyScreenings = await storage.getFamilyMemberScreenings(familyId);
      const existingScreening = existingFamilyScreenings.find(fms => fms.screeningId === screeningId);
      
      // Create or update the family member screening record
      let familyScreening;
      if (existingScreening) {
        familyScreening = await storage.updateFamilyMemberScreening(existingScreening.id, {
          lastCompleted: lastCompleted || new Date().toISOString(),
          nextDue: existingScreening.nextDue, // Keep the existing next due date
          status: status || "completed"
        });
      } else {
        // For new screenings, calculate based on age
        const birthDate = new Date(familyMember.dateOfBirth);
        const birthYear = birthDate.getFullYear();
        const targetYear = birthYear + screening.startAge;
        const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
        
        familyScreening = await storage.createFamilyMemberScreening({
          familyMemberId: familyId,
          screeningId: screeningId,
          lastCompleted: lastCompleted || new Date().toISOString(),
          nextDue: nextDue.toISOString(),
          status: status || "completed"
        });
      }

      if (!familyScreening) {
        res.status(500).json({ message: "Failed to create or update family member screening" });
        return;
      }

      // If completing a screening and it has a frequency, create the next screening
      if (screening.frequencyYears > 0) {
        // Check for existing future screening
        const hasFutureScreening = existingFamilyScreenings.some(fms => 
          fms.screeningId === screening.id && 
          fms.status === 'later' && 
          fms.id !== familyScreening.id
        );

        if (hasFutureScreening) {
          console.log(`[POST /api/family/${familyId}/screenings/${screeningId}/complete] Not creating repeatable screening: another future screening exists`);
          res.status(400).json({ 
            message: "You already have a future test scheduled. Please complete your current tests first.",
            error: "FUTURE_TEST_EXISTS"
          });
          return;
        }

        // Calculate the next due date based on the current date
        const nextDueDate = new Date();
        nextDueDate.setFullYear(nextDueDate.getFullYear() + screening.frequencyYears);

        console.log(`[POST /api/family/${familyId}/screenings/${screeningId}/complete] Creating repeatable screening with nextDue: ${nextDueDate.toISOString()}, status: laterRecreated`);
        // Create the next screening with the calculated next due date
        const newFamilyScreening = await storage.createFamilyMemberScreening({
          familyMemberId: familyId,
          screeningId: screening.id,
          lastCompleted: null,
          nextDue: nextDueDate.toISOString(),
          status: "laterRecreated" // Set new screenings as "laterRecreated" for recreated tests
        });
        
        // Schedule WhatsApp reminder if family member has phone number
        try {
          if (familyMember.phoneNumber) {
            const notificationScheduler = NotificationScheduler.getInstance();
            const jobId = await notificationScheduler.scheduleFamilyMemberScreeningReminder(
              familyId,
              screening.id,
              nextDueDate,
              7 // 7 days before due date
            );
            console.log(`✅ Scheduled WhatsApp reminder for family member ${familyMember.name} - ${screening.name} (Job ID: ${jobId})`);
          }
        } catch (error) {
          console.error('Error scheduling WhatsApp reminder for family member screening:', error);
        }
        
        // Delete the completed screening
        await storage.deleteFamilyMemberScreening(familyScreening.id);
      } else {
        console.log(`[POST /api/family/${familyId}/screenings/${screeningId}/complete] Non-repeatable screening marked as completed, no new screening created`);
      }
      
      res.json(familyScreening);
    } catch (error) {
      console.error("Error marking family member screening as completed:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Mark family member screening as not completed (uncomplete)
  app.patch("/api/family/:familyId/screenings/:screeningId/uncomplete", async (req, res) => {
    try {
      const familyId = parseInt(req.params.familyId);
      const screeningId = parseInt(req.params.screeningId);
      
      // Get the family member to verify it exists
      const familyMember = await storage.getFamilyMember(familyId);
      if (!familyMember) {
        res.status(404).json({ message: "Family member not found" });
        return;
      }
      
      // Get the screening to verify it exists and calculate next due date
      const screening = await storage.getScreening(screeningId);
      if (!screening) {
        res.status(404).json({ message: "Screening not found" });
        return;
      }
      
      // Find the existing family member screening record
      const existingFamilyScreenings = await storage.getFamilyMemberScreenings(familyId);
      const existingScreening = existingFamilyScreenings.find(fms => fms.screeningId === screeningId);
      
      if (!existingScreening) {
        res.status(404).json({ message: "Family member screening record not found" });
        return;
      }
      
      // Calculate new next due date based on family member's age and screening frequency
      const birthDate = new Date(familyMember.dateOfBirth);
      const birthYear = birthDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const targetYear = birthYear + screening.startAge;
      const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
      
      // Determine new status
      let status: "due" | "overdue" | "later";
      
      if (currentYear < targetYear) {
        status = "later";
      } else if (currentYear === targetYear || currentYear === targetYear + 1) {
        status = "due";  
      } else {
        status = "overdue";
      }
      
      // Update the family member screening record
      const updatedScreening = await storage.updateFamilyMemberScreening(existingScreening.id, {
        lastCompleted: null,
        nextDue: nextDue.toISOString(),
        status: status
      });
      
      if (!updatedScreening) {
        res.status(500).json({ message: "Failed to update family member screening" });
        return;
      }
      
      res.json(updatedScreening);
    } catch (error) {
      console.error("Error marking family member screening as not completed:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // WhatsApp Notification Routes
  app.post("/api/notifications/schedule-screening", async (req, res) => {
    try {
      const { userId, screeningId, dueDate, reminderDays = 7 } = req.body;
      
      if (!userId || !screeningId || !dueDate) {
        return res.status(400).json({ error: 'userId, screeningId, and dueDate are required' });
      }

      const notificationScheduler = NotificationScheduler.getInstance();
      const jobId = await notificationScheduler.scheduleScreeningReminder(
        userId,
        screeningId,
        new Date(dueDate),
        reminderDays
      );

      res.json({ 
        success: true, 
        jobId,
        message: 'Screening reminder scheduled successfully' 
      });
    } catch (error) {
      console.error('Error scheduling screening reminder:', error);
      res.status(500).json({ error: 'Failed to schedule screening reminder' });
    }
  });

  app.post("/api/notifications/schedule-family-screening", async (req, res) => {
    try {
      const { familyMemberId, screeningId, dueDate, reminderDays = 7 } = req.body;
      
      if (!familyMemberId || !screeningId || !dueDate) {
        return res.status(400).json({ error: 'familyMemberId, screeningId, and dueDate are required' });
      }

      const notificationScheduler = NotificationScheduler.getInstance();
      const jobId = await notificationScheduler.scheduleFamilyMemberScreeningReminder(
        familyMemberId,
        screeningId,
        new Date(dueDate),
        reminderDays
      );

      res.json({ 
        success: true, 
        jobId,
        message: 'Family screening reminder scheduled successfully' 
      });
    } catch (error) {
      console.error('Error scheduling family screening reminder:', error);
      res.status(500).json({ error: 'Failed to schedule family screening reminder' });
    }
  });

  app.post("/api/notifications/send-welcome", async (req, res) => {
    try {
      const { phoneNumber, personName } = req.body;
      
      if (!phoneNumber || !personName) {
        return res.status(400).json({ error: 'phoneNumber and personName are required' });
      }

      const whatsappService = WhatsAppService.getInstance();
      const success = await whatsappService.sendWelcomeMessage(phoneNumber, personName);

      if (success) {
        res.json({ 
          success: true, 
          message: 'Welcome message sent successfully' 
        });
      } else {
        res.status(500).json({ error: 'Failed to send welcome message' });
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
      res.status(500).json({ error: 'Failed to send welcome message' });
    }
  });

  app.get("/api/notifications/status", async (req, res) => {
    try {
      const whatsappService = WhatsAppService.getInstance();
      const notificationScheduler = NotificationScheduler.getInstance();
      
      res.json({
        whatsappService: {
          initialized: !!process.env.TWILIO_ACCOUNT_SID,
          hasToken: !!process.env.TWILIO_ACCOUNT_SID
        },
        scheduler: {
          running: true // The scheduler is always running once initialized
        }
      });
    } catch (error) {
      console.error('Error getting notification status:', error);
      res.status(500).json({ error: 'Failed to get notification status' });
    }
  });

  // Schedule WhatsApp reminders for all due screenings of a user or family member
  app.post("/api/notifications/schedule-all-reminders", async (req, res) => {
    try {
      const { userId, familyMemberId } = req.body;
      
      if (!userId && !familyMemberId) {
        return res.status(400).json({ error: 'Either userId or familyMemberId is required' });
      }

      const notificationScheduler = NotificationScheduler.getInstance();
      const scheduledJobs = [];

      if (userId) {
        // Schedule reminders for user screenings
        const user = await storage.getUser(userId);
        if (!user || !user.phoneNumber) {
          return res.status(400).json({ error: 'User not found or no phone number' });
        }

        const userScreenings = await storage.getUserScreenings(userId);
        for (const screening of userScreenings) {
          if (screening.status === "due") {
            try {
              const jobId = await notificationScheduler.scheduleScreeningReminder(
                userId,
                screening.screeningId,
                new Date(screening.nextDue),
                7
              );
              scheduledJobs.push({
                type: 'user',
                screeningId: screening.screeningId,
                jobId,
                dueDate: screening.nextDue
              });
            } catch (error) {
              console.error(`Error scheduling reminder for user screening ${screening.id}:`, error);
            }
          }
        }
      }

      if (familyMemberId) {
        // Schedule reminders for family member screenings
        const familyMember = await storage.getFamilyMember(familyMemberId);
        if (!familyMember || !familyMember.phoneNumber) {
          return res.status(400).json({ error: 'Family member not found or no phone number' });
        }

        const familyScreenings = await storage.getFamilyMemberScreenings(familyMemberId);
        for (const screening of familyScreenings) {
          if (screening.status === "due") {
            try {
              const jobId = await notificationScheduler.scheduleFamilyMemberScreeningReminder(
                familyMemberId,
                screening.screeningId,
                new Date(screening.nextDue),
                7
              );
              scheduledJobs.push({
                type: 'family',
                screeningId: screening.screeningId,
                jobId,
                dueDate: screening.nextDue
              });
            } catch (error) {
              console.error(`Error scheduling reminder for family screening ${screening.id}:`, error);
            }
          }
        }
      }

      res.json({
        success: true,
        message: `Scheduled ${scheduledJobs.length} WhatsApp reminders`,
        scheduledJobs
      });
    } catch (error) {
      console.error('Error scheduling all reminders:', error);
      res.status(500).json({ error: 'Failed to schedule reminders' });
    }
  });

  // Educational content routes
  app.get("/api/educational-content", async (req, res) => {
    try {
      const content = await db.query.educationalContent.findMany({
        where: (content, { eq }) => eq(content.isActive, true),
        orderBy: (content, { asc }) => [asc(content.category), asc(content.id)]
      });
      res.json(content);
    } catch (error) {
      console.error("Error fetching educational content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin educational content routes
  app.get("/api/admin/educational-content", authenticateAdmin, async (req, res) => {
    try {
      const content = await db.query.educationalContent.findMany({
        orderBy: (content, { desc }) => [desc(content.createdAt)]
      });
      res.json(content);
    } catch (error) {
      console.error("Error fetching educational content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/educational-content", authenticateAdmin, async (req, res) => {
    try {
      const contentData = insertEducationalContentSchema.parse(req.body);
      const [newContent] = await db.insert(educationalContent).values({
        ...contentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      res.json(newContent);
    } catch (error) {
      console.error("Error creating educational content:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/admin/educational-content/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertEducationalContentSchema.partial().parse(req.body);
      
      const [updatedContent] = await db.update(educationalContent)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(educationalContent.id, id))
        .returning();

      if (!updatedContent) {
        res.status(404).json({ message: "Educational content not found" });
        return;
      }

      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating educational content:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/admin/educational-content/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [deletedContent] = await db.delete(educationalContent)
        .where(eq(educationalContent.id, id))
        .returning();

      if (!deletedContent) {
        res.status(404).json({ message: "Educational content not found" });
        return;
      }

      res.json({ message: "Educational content deleted successfully" });
    } catch (error) {
      console.error("Error deleting educational content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create initial admin user if none exists
  const createInitialAdmin = async () => {
    try {
      const adminExists = await db.query.adminUsers.findFirst();
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(adminUsers).values({
          username: 'admin',
          password: hashedPassword,
        });
        console.log('Initial admin user created');
      }
    } catch (error) {
      console.error('Error creating initial admin:', error);
    }
  };

  // Call this when the server starts
  createInitialAdmin();

  // Protect all admin routes
  app.use('/api/admin/*', authenticateAdmin);

  // Protected admin route example
  app.get('/api/admin/dashboard', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Add your admin dashboard data here
      res.json({ message: 'Welcome to admin dashboard' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Add BMI calculation functions
const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

const getBMICategory = (bmi: number): string => {
  if (bmi < 18.4) return 'نقص في الوزن';
  if (18.5 <= bmi && bmi < 24.9) return 'وزنك طبيعي';
  if (25 <= bmi && bmi < 29.9) return 'مرحلة ماقبل السمنة';
  if (30 <= bmi && bmi < 34.9) return 'سمنة درجة أولى';
  if (35 <= bmi && bmi < 39.9) return 'سمنة درجة ثانية';
  if (bmi > 40) return 'سمنة مفرطة درجة ثالثة';
  return 'حاول مرة أخرى';
};
