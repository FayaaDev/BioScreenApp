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

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
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
      const userData = insertUserSchema.parse(req.body);
      
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
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
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
      
      const screeningsWithDetails = userScreenings.map(us => {
        const screening = allScreenings.find(s => s.id === us.screeningId);
        
        // Dynamically calculate status if not completed
        let status = us.status;
        if (status !== "completed" && screening) {
          const birthDate = new Date(user.dateOfBirth);
          const birthYear = birthDate.getFullYear();
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          
          // Calculate the year when user turns the start age
          const targetYear = birthYear + screening.startAge;
          
          // Determine status based on current date vs target date
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
        }
        
        return {
          ...us,
          status,
          screening
        };
      });

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
      const familyMemberData = insertFamilyMemberSchema.parse({
        ...req.body,
        userId
      });
      
      const familyMember = await storage.createFamilyMember(familyMemberData);
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
      const updates = insertFamilyMemberSchema.partial().parse(req.body);
      const familyMember = await storage.updateFamilyMember(id, updates);
      
      if (!familyMember) {
        res.status(404).json({ message: "Family member not found" });
        return;
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
        // Include all gender-appropriate screenings regardless of age to show "later" screenings
        // We'll filter by age in the status calculation
        
        return genderMatches;
      }).map(screening => {
        // Check if there's an existing family member screening record
        const existingScreening = existingFamilyScreenings.find(fms => fms.screeningId === screening.id);
        
        if (existingScreening) {
          // Return the existing screening record with full details
          return {
            id: existingScreening.id,
            userId: familyMember.userId,
            screeningId: screening.id,
            lastCompleted: existingScreening.lastCompleted,
            nextDue: existingScreening.nextDue,
            status: existingScreening.status,
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
      
      res.json({
        familyMember,
        screenings: applicableScreenings
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
      
      // If uncompleting (status is 'upcoming' and lastCompleted is null), recalculate status
      if (updates.status === 'upcoming' && updates.lastCompleted === null) {
        const userScreenings = await storage.getUserScreenings(id);
        const userScreening = userScreenings.find(us => us.id === id);
        if (!userScreening) {
          res.status(404).json({ message: "User screening not found" });
          return;
        }
        const user = await storage.getUser(userScreening.userId);
        const screening = await storage.getScreening(userScreening.screeningId);
        if (!user || !screening) {
          res.status(404).json({ message: "User or screening not found" });
          return;
        }
        const birthYear = new Date(user.dateOfBirth).getFullYear();
        const targetYear = birthYear + screening.startAge;
        const currentYear = new Date().getFullYear();
        let newStatus: "due" | "overdue" | "later";
        if (currentYear < targetYear) {
          newStatus = "later";
        } else if (currentYear === targetYear || currentYear === targetYear + 1) {
          newStatus = "due";
        } else {
          newStatus = "overdue";
        }
        updates.status = newStatus;
      }
      
      const userScreening = await storage.updateUserScreening(id, updates);
      if (!userScreening) {
        res.status(404).json({ message: "User screening not found" });
        return;
      }
      res.json(userScreening);
    } catch (error) {
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
      
      // Create or update the family member screening record
      const familyScreening = await storage.createFamilyMemberScreening({
        familyMemberId: familyId,
        screeningId: screeningId,
        lastCompleted: lastCompleted || null,
        nextDue: nextDue || new Date().toISOString(),
        status: status || "completed"
      });
      
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
      const memberAge = new Date().getFullYear() - new Date(familyMember.dateOfBirth).getFullYear();
      const birthYear = new Date(familyMember.dateOfBirth).getFullYear();
      const targetYear = birthYear + screening.startAge;
      const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
      
      // Determine new status
      const currentYear = new Date().getFullYear();
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
