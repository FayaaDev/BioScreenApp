import { users, screenings, userScreenings, familyMembers, familyMemberScreenings, type User, type InsertUser, type Screening, type InsertScreening, type UserScreening, type InsertUserScreening, type FamilyMember, type InsertFamilyMember, type FamilyMemberScreening, type InsertFamilyMemberScreening } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { insertUserSchema, insertFamilyMemberSchema, insertScreeningSchema } from '@shared/schema';

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Family member operations
  createFamilyMember(familyMember: InsertFamilyMember): Promise<FamilyMember>;
  getFamilyMembers(userId: number): Promise<FamilyMember[]>;
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  updateFamilyMember(id: number, familyMember: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;
  
  // Screening operations
  getScreenings(): Promise<Screening[]>;
  createScreening(screening: InsertScreening): Promise<Screening>;
  updateScreening(id: number, screening: Partial<InsertScreening>): Promise<Screening | undefined>;
  deleteScreening(id: number): Promise<boolean>;
  
  // User screening operations
  getUserScreenings(userId: number): Promise<UserScreening[]>;
  createUserScreening(userScreening: InsertUserScreening): Promise<UserScreening>;
  updateUserScreening(id: number, userScreening: Partial<InsertUserScreening>): Promise<UserScreening | undefined>;
  getUserScreeningById(id: number): Promise<UserScreening | undefined>;
  deleteUserScreening(id: number): Promise<boolean>;
  
  // Family member screening operations  
  createFamilyMemberScreening(familyMemberScreening: InsertFamilyMemberScreening): Promise<FamilyMemberScreening>;
  getFamilyMemberScreenings(familyMemberId: number): Promise<FamilyMemberScreening[]>;
  updateFamilyMemberScreening(id: number, familyMemberScreening: Partial<InsertFamilyMemberScreening>): Promise<FamilyMemberScreening | undefined>;
  deleteFamilyMemberScreening(id: number): Promise<boolean>;
  
  // Initialize with default screenings
  initializeDefaultScreenings(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private screenings: Map<number, Screening>;
  private userScreenings: Map<number, UserScreening>;
  private familyMembers: Map<number, FamilyMember>;
  private familyMemberScreenings: Map<number, FamilyMemberScreening>;
  private currentUserId: number;
  private currentScreeningId: number;
  private currentUserScreeningId: number;
  private currentFamilyMemberId: number;
  private currentFamilyMemberScreeningId: number;
  private initialized: boolean;

  constructor() {
    this.users = new Map();
    this.screenings = new Map();
    this.userScreenings = new Map();
    this.familyMembers = new Map();
    this.familyMemberScreenings = new Map();
    this.currentUserId = 1;
    this.currentScreeningId = 1;
    this.currentUserScreeningId = 1;
    this.currentFamilyMemberId = 1;
    this.currentFamilyMemberScreeningId = 1;
    this.initialized = false;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...userData,
      id,
      password: userData.password || "temp_password",
      phoneNumber: userData.phoneNumber ?? null,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date().toISOString(),
      isDiabetic: userData.isDiabetic ?? null,
      isHypertensive: userData.isHypertensive ?? null,
      isCholesterol: userData.isCholesterol ?? null,
      isSmoker: userData.isSmoker ?? null,
      smokingAmount: userData.smokingAmount ?? null,
      smokingDuration: userData.smokingDuration ?? null,
      height: userData.height ?? null,
      weight: userData.weight ?? null,
      isPregnant: userData.isPregnant ?? null,
      isSexuallyActive: userData.isSexuallyActive ?? null,
      sexualPartnerCount: userData.sexualPartnerCount ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createFamilyMember(familyMemberData: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentFamilyMemberId++;
    const familyMember: FamilyMember = { 
      ...familyMemberData,
      id,
      createdAt: new Date().toISOString(),
      phoneNumber: familyMemberData.phoneNumber ?? null,
      isDiabetic: familyMemberData.isDiabetic ?? null,
      isHypertensive: familyMemberData.isHypertensive ?? null,
      isCholesterol: familyMemberData.isCholesterol ?? null,
      isSmoker: familyMemberData.isSmoker ?? null,
      smokingAmount: familyMemberData.smokingAmount ?? null,
      smokingDuration: familyMemberData.smokingDuration ?? null,
      height: familyMemberData.height ?? null,
      weight: familyMemberData.weight ?? null,
      isPregnant: familyMemberData.isPregnant ?? null,
      isSexuallyActive: familyMemberData.isSexuallyActive ?? null,
      sexualPartnerCount: familyMemberData.sexualPartnerCount ?? null
    };
    this.familyMembers.set(id, familyMember);
    return familyMember;
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(fm => fm.userId === userId);
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }

  async updateFamilyMember(id: number, updates: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const familyMember = this.familyMembers.get(id);
    if (!familyMember) return undefined;
    
    const updated = { ...familyMember, ...updates };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    return this.familyMembers.delete(id);
  }

  async getScreenings(): Promise<Screening[]> {
    if (!this.initialized) {
      await this.initializeDefaultScreenings();
    }
    return Array.from(this.screenings.values()).filter(s => s.isActive);
  }

  async createScreening(screeningData: InsertScreening): Promise<Screening> {
    const id = this.currentScreeningId++;
    const screening: Screening = { 
      ...screeningData,
      id,
      isActive: true,
      endAge: screeningData.endAge ?? null,
      iconUrl: screeningData.iconUrl ?? null,
      priority: screeningData.priority ?? "recommended",
      specialCode: screeningData.specialCode ?? null
    };
    this.screenings.set(id, screening);
    return screening;
  }

  async updateScreening(id: number, updates: Partial<InsertScreening>): Promise<Screening | undefined> {
    const screening = this.screenings.get(id);
    if (!screening) return undefined;
    
    const updated = { ...screening, ...updates };
    this.screenings.set(id, updated);
    return updated;
  }

  async deleteScreening(id: number): Promise<boolean> {
    const screening = this.screenings.get(id);
    if (!screening) return false;
    
    screening.isActive = false;
    this.screenings.set(id, screening);
    return true;
  }

  async getUserScreenings(userId: number): Promise<UserScreening[]> {
    return Array.from(this.userScreenings.values()).filter(us => us.userId === userId);
  }

  async createUserScreening(insertUserScreening: InsertUserScreening): Promise<UserScreening> {
    const id = this.currentUserScreeningId++;
    const userScreening: UserScreening = { 
      ...insertUserScreening,
      id,
      lastCompleted: insertUserScreening.lastCompleted ?? null
    };
    this.userScreenings.set(id, userScreening);
    return userScreening;
  }

  async updateUserScreening(id: number, updates: Partial<InsertUserScreening>): Promise<UserScreening | undefined> {
    const userScreening = this.userScreenings.get(id);
    if (!userScreening) return undefined;
    
    const updated = { ...userScreening, ...updates };
    this.userScreenings.set(id, updated);
    return updated;
  }

  async createFamilyMemberScreening(insertFamilyMemberScreening: InsertFamilyMemberScreening): Promise<FamilyMemberScreening> {
    const id = this.currentFamilyMemberScreeningId++;
    const familyMemberScreening: FamilyMemberScreening = { 
      ...insertFamilyMemberScreening,
      id,
      lastCompleted: insertFamilyMemberScreening.lastCompleted ?? null,
      createdAt: new Date().toISOString()
    };
    this.familyMemberScreenings.set(id, familyMemberScreening);
    return familyMemberScreening;
  }

  async getFamilyMemberScreenings(familyMemberId: number): Promise<FamilyMemberScreening[]> {
    return Array.from(this.familyMemberScreenings.values()).filter(fms => fms.familyMemberId === familyMemberId);
  }

  async updateFamilyMemberScreening(id: number, updates: Partial<InsertFamilyMemberScreening>): Promise<FamilyMemberScreening | undefined> {
    const familyMemberScreening = this.familyMemberScreenings.get(id);
    if (!familyMemberScreening) return undefined;
    
    const updated = { ...familyMemberScreening, ...updates };
    this.familyMemberScreenings.set(id, updated);
    return updated;
  }

  async getScreening(id: number): Promise<Screening | undefined> {
    return this.screenings.get(id);
  }

  async initializeDefaultScreenings(): Promise<void> {
    if (this.initialized) return;
    
    const defaultScreenings: InsertScreening[] = [
      {
        name: "Mammography",
        description: "Breast cancer screening using X-ray imaging",
        category: "Cancer Screening",
        genderApplicable: "female",
        startAge: 40,
        endAge: 74,
        frequencyYears: 2
      },
      {
        name: "Colonoscopy",
        description: "Colorectal cancer screening procedure",
        category: "Cancer Screening",
        genderApplicable: "both",
        startAge: 45,
        endAge: 75,
        frequencyYears: 10
      },
      {
        name: "PSA Test",
        description: "Prostate cancer screening blood test",
        category: "Cancer Screening",
        genderApplicable: "male",
        startAge: 50,
        endAge: 70,
        frequencyYears: 2
      },
      {
        name: "Blood Pressure Check",
        description: "Cardiovascular health monitoring",
        category: "Cardiovascular",
        genderApplicable: "both",
        startAge: 18,
        endAge: null,
        frequencyYears: 2
      },
      {
        name: "Cholesterol Test",
        description: "Lipid panel for heart disease risk assessment",
        category: "Cardiovascular",
        genderApplicable: "both",
        startAge: 20,
        endAge: null,
        frequencyYears: 5
      },
      {
        name: "Bone Density Test",
        description: "Osteoporosis screening",
        category: "Bone Health",
        genderApplicable: "female",
        startAge: 65,
        endAge: null,
        frequencyYears: 2
      },
      {
        name: "Eye Exam",
        description: "Comprehensive vision and eye health check",
        category: "Vision/Hearing",
        genderApplicable: "both",
        startAge: 40,
        endAge: null,
        frequencyYears: 2
      },
      {
        name: "Flu Vaccination",
        description: "Annual influenza vaccination",
        category: "Vaccinations",
        genderApplicable: "both",
        startAge: 6,
        endAge: null,
        frequencyYears: 1
      },
      {
        name: "Annual Physical Exam",
        description: "Comprehensive health checkup",
        category: "Preventive",
        genderApplicable: "both",
        startAge: 18,
        endAge: null,
        frequencyYears: 1
      }
    ];

    for (const screening of defaultScreenings) {
      await this.createScreening(screening);
    }
    
    this.initialized = true;
  }

  async getUserScreeningById(id: number): Promise<UserScreening | undefined> {
    return this.userScreenings.get(id);
  }

  async deleteUserScreening(id: number): Promise<boolean> {
    try {
      const [deleted] = await db.delete(userScreenings)
        .where(eq(userScreenings.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error('Error deleting user screening:', error);
      return false;
    }
  }

  async deleteFamilyMemberScreening(id: number): Promise<boolean> {
    try {
      const [deleted] = await db.delete(familyMemberScreenings)
        .where(eq(familyMemberScreenings.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error('Error deleting family member screening:', error);
      return false;
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private initialized: boolean = false;

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phoneNumber: userData.phoneNumber ?? null,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      isAdmin: userData.isAdmin,
      createdAt: new Date().toISOString(),
      isDiabetic: userData.isDiabetic ?? null,
      isHypertensive: userData.isHypertensive ?? null,
      isCholesterol: userData.isCholesterol ?? null,
      isSmoker: userData.isSmoker ?? null,
      smokingAmount: userData.smokingAmount ?? null,
      smokingDuration: userData.smokingDuration ?? null,
      height: userData.height ?? null,
      weight: userData.weight ?? null,
      isPregnant: userData.isPregnant ?? null,
      isSexuallyActive: userData.isSexuallyActive ?? null,
      sexualPartnerCount: userData.sexualPartnerCount ?? null
    }).returning();
    return result[0];
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createFamilyMember(familyMemberData: InsertFamilyMember): Promise<FamilyMember> {
    const result = await db.insert(familyMembers).values({
      name: familyMemberData.name,
      gender: familyMemberData.gender,
      dateOfBirth: familyMemberData.dateOfBirth,
      userId: familyMemberData.userId,
      relationship: familyMemberData.relationship,
      phoneNumber: familyMemberData.phoneNumber ?? null,
      createdAt: new Date().toISOString(),
      isDiabetic: familyMemberData.isDiabetic ?? null,
      isHypertensive: familyMemberData.isHypertensive ?? null,
      isCholesterol: familyMemberData.isCholesterol ?? null,
      isSmoker: familyMemberData.isSmoker ?? null,
      smokingAmount: familyMemberData.smokingAmount ?? null,
      smokingDuration: familyMemberData.smokingDuration ?? null,
      height: familyMemberData.height ?? null,
      weight: familyMemberData.weight ?? null,
      isPregnant: familyMemberData.isPregnant ?? null,
      isSexuallyActive: familyMemberData.isSexuallyActive ?? null,
      sexualPartnerCount: familyMemberData.sexualPartnerCount ?? null
    }).returning();
    return result[0];
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [familyMember] = await db.select().from(familyMembers).where(eq(familyMembers.id, id));
    return familyMember || undefined;
  }

  async updateFamilyMember(id: number, updates: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const [familyMember] = await db
      .update(familyMembers)
      .set(updates)
      .where(eq(familyMembers.id, id))
      .returning();
    return familyMember || undefined;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    const result = await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getScreenings(): Promise<Screening[]> {
    await this.ensureInitialized();
    return await db.select().from(screenings).where(eq(screenings.isActive, true));
  }

  async createScreening(screeningData: InsertScreening): Promise<Screening> {
    const result = await db.insert(screenings).values({
      name: screeningData.name,
      description: screeningData.description,
      category: screeningData.category,
      genderApplicable: screeningData.genderApplicable,
      startAge: screeningData.startAge,
      endAge: screeningData.endAge ?? null,
      frequencyYears: screeningData.frequencyYears,
      isActive: true,
      iconUrl: screeningData.iconUrl ?? null,
      priority: screeningData.priority ?? 'recommended',
      specialCode: screeningData.specialCode ?? null
    }).returning();
    return result[0];
  }

  async updateScreening(id: number, updates: Partial<InsertScreening>): Promise<Screening | undefined> {
    const [screening] = await db
      .update(screenings)
      .set(updates)
      .where(eq(screenings.id, id))
      .returning();
    return screening || undefined;
  }

  async deleteScreening(id: number): Promise<boolean> {
    const result = await db
      .update(screenings)
      .set({ isActive: false })
      .where(eq(screenings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserScreenings(userId: number): Promise<UserScreening[]> {
    return await db.select().from(userScreenings).where(eq(userScreenings.userId, userId));
  }

  async createUserScreening(insertUserScreening: InsertUserScreening): Promise<UserScreening> {
    const [userScreening] = await db
      .insert(userScreenings)
      .values(insertUserScreening)
      .returning();
    return userScreening;
  }

  async updateUserScreening(id: number, updates: Partial<InsertUserScreening>): Promise<UserScreening | undefined> {
    const [userScreening] = await db
      .update(userScreenings)
      .set(updates)
      .where(eq(userScreenings.id, id))
      .returning();
    return userScreening || undefined;
  }

  async createFamilyMemberScreening(insertFamilyMemberScreening: InsertFamilyMemberScreening): Promise<FamilyMemberScreening> {
    const [familyMemberScreening] = await db
      .insert(familyMemberScreenings)
      .values({ ...insertFamilyMemberScreening, createdAt: new Date().toISOString() })
      .returning();
    return familyMemberScreening;
  }

  async getFamilyMemberScreenings(familyMemberId: number): Promise<FamilyMemberScreening[]> {
    return await db.select().from(familyMemberScreenings).where(eq(familyMemberScreenings.familyMemberId, familyMemberId));
  }

  async updateFamilyMemberScreening(id: number, updates: Partial<InsertFamilyMemberScreening>): Promise<FamilyMemberScreening | undefined> {
    const [familyMemberScreening] = await db
      .update(familyMemberScreenings)
      .set(updates)
      .where(eq(familyMemberScreenings.id, id))
      .returning();
    return familyMemberScreening || undefined;
  }

  async getScreening(id: number): Promise<Screening | undefined> {
    const [screening] = await db.select().from(screenings).where(eq(screenings.id, id));
    return screening || undefined;
  }

  async initializeDefaultScreenings(): Promise<void> {
    if (this.initialized) return;
    
    const existingScreenings = await db.select().from(screenings);
    if (existingScreenings.length > 0) {
      this.initialized = true;
      return;
    }

    const defaultScreenings = [
      {
        name: "Annual Physical Exam",
        description: "Complete physical examination with vital signs and basic health assessment",
        category: "General Health",
        genderApplicable: "both",
        startAge: 18,
        endAge: null,
        frequencyYears: 1,
        isActive: true
      },
      {
        name: "Mammography",
        description: "Breast cancer screening using low-dose X-rays",
        category: "Cancer Screening",
        genderApplicable: "female",
        startAge: 40,
        endAge: null,
        frequencyYears: 1,
        isActive: true
      },
      {
        name: "Colonoscopy",
        description: "Colorectal cancer screening using a flexible tube with camera",
        category: "Cancer Screening", 
        genderApplicable: "both",
        startAge: 45,
        endAge: 75,
        frequencyYears: 10,
        isActive: true
      },
      {
        name: "Pap Smear",
        description: "Cervical cancer screening test",
        category: "Cancer Screening",
        genderApplicable: "female",
        startAge: 21,
        endAge: 65,
        frequencyYears: 3,
        isActive: true
      },
      {
        name: "Prostate Exam",
        description: "Prostate cancer screening including PSA blood test",
        category: "Cancer Screening",
        genderApplicable: "male",
        startAge: 50,
        endAge: null,
        frequencyYears: 1,
        isActive: true
      }
    ];

    await db.insert(screenings).values(defaultScreenings);
    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDefaultScreenings();
    }
  }

  async getUserScreeningById(id: number): Promise<UserScreening | undefined> {
    const result = await db.select().from(userScreenings).where(eq(userScreenings.id, id));
    return result[0];
  }

  async deleteUserScreening(id: number): Promise<boolean> {
    try {
      const result = await db.delete(userScreenings)
        .where(eq(userScreenings.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user screening:', error);
      return false;
    }
  }

  async deleteFamilyMemberScreening(id: number): Promise<boolean> {
    try {
      const result = await db.delete(familyMemberScreenings)
        .where(eq(familyMemberScreenings.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting family member screening:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
