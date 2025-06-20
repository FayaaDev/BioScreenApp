import { db } from './db';
import { users, familyMembers, userScreenings, familyMemberScreenings, screenings } from '@shared/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import WhatsAppService from './whatsappService';

export interface NotificationJob {
  id: string;
  type: 'screening_reminder' | 'overdue_reminder' | 'appointment_reminder';
  userId?: number;
  familyMemberId?: number;
  screeningId: number;
  phoneNumber: string;
  personName: string;
  screeningName: string;
  dueDate: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationScheduler {
  private static instance: NotificationScheduler;
  private whatsappService: WhatsAppService;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  constructor() {
    this.whatsappService = WhatsAppService.getInstance();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing WhatsApp notification scheduler...');
    
    // Start the scheduler
    this.startScheduler();
    
    // Schedule daily check for overdue screenings
    this.scheduleDailyOverdueCheck();
  }

  private startScheduler(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('📅 WhatsApp notification scheduler started');

    // Check for pending notifications every 5 minutes
    this.checkInterval = setInterval(async () => {
      await this.processPendingNotifications();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async scheduleDailyOverdueCheck(): Promise<void> {
    // Schedule daily check at 9 AM
    const now = new Date();
    const nextCheck = new Date(now);
    nextCheck.setHours(9, 0, 0, 0);
    
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1);
    }

    const timeUntilNextCheck = nextCheck.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.checkOverdueScreenings();
      // Schedule next daily check
      this.scheduleDailyOverdueCheck();
    }, timeUntilNextCheck);
  }

  async scheduleScreeningReminder(
    userId: number,
    screeningId: number,
    dueDate: Date,
    reminderDays: number = 7
  ): Promise<string> {
    try {
      // Get user and screening details
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const screening = await db.select().from(screenings).where(eq(screenings.id, screeningId)).limit(1);

      if (!user[0] || !screening[0] || !user[0].phoneNumber) {
        throw new Error('User, screening, or phone number not found');
      }

      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      const jobId = `screening_${userId}_${screeningId}_${Date.now()}`;

      // Store the notification job (in a real implementation, you'd use a database table)
      const job: NotificationJob = {
        id: jobId,
        type: 'screening_reminder',
        userId,
        screeningId,
        phoneNumber: user[0].phoneNumber,
        personName: user[0].name,
        screeningName: screening[0].name,
        dueDate: dueDate.toISOString().split('T')[0],
        scheduledFor: reminderDate,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in memory for now (in production, use a proper job queue like Bull)
      this.storeJob(job);

      console.log(`📅 Scheduled screening reminder for ${user[0].name} - ${screening[0].name} on ${reminderDate.toISOString()}`);
      return jobId;
    } catch (error) {
      console.error('Error scheduling screening reminder:', error);
      throw error;
    }
  }

  async scheduleFamilyMemberScreeningReminder(
    familyMemberId: number,
    screeningId: number,
    dueDate: Date,
    reminderDays: number = 7
  ): Promise<string> {
    try {
      // Get family member and screening details
      const familyMember = await db.select().from(familyMembers).where(eq(familyMembers.id, familyMemberId)).limit(1);
      const screening = await db.select().from(screenings).where(eq(screenings.id, screeningId)).limit(1);

      if (!familyMember[0] || !screening[0] || !familyMember[0].phoneNumber) {
        throw new Error('Family member, screening, or phone number not found');
      }

      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      const jobId = `family_screening_${familyMemberId}_${screeningId}_${Date.now()}`;

      const job: NotificationJob = {
        id: jobId,
        type: 'screening_reminder',
        familyMemberId,
        screeningId,
        phoneNumber: familyMember[0].phoneNumber,
        personName: familyMember[0].name,
        screeningName: screening[0].name,
        dueDate: dueDate.toISOString().split('T')[0],
        scheduledFor: reminderDate,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.storeJob(job);

      console.log(`📅 Scheduled family screening reminder for ${familyMember[0].name} - ${screening[0].name} on ${reminderDate.toISOString()}`);
      return jobId;
    } catch (error) {
      console.error('Error scheduling family screening reminder:', error);
      throw error;
    }
  }

  private async processPendingNotifications(): Promise<void> {
    try {
      const now = new Date();
      const pendingJobs = this.getPendingJobs().filter(job => 
        job.scheduledFor <= now && job.status === 'pending'
      );

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  private async processJob(job: NotificationJob): Promise<void> {
    try {
      console.log(`📤 Processing notification job: ${job.id}`);

      let success = false;

      switch (job.type) {
        case 'screening_reminder':
          success = await this.whatsappService.sendScreeningReminder(
            job.phoneNumber,
            job.personName,
            job.screeningName,
            job.dueDate
          );
          break;
        case 'overdue_reminder':
          const daysOverdue = Math.floor((new Date().getTime() - new Date(job.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          success = await this.whatsappService.sendOverdueReminder(
            job.phoneNumber,
            job.personName,
            job.screeningName,
            daysOverdue
          );
          break;
      }

      if (success) {
        job.status = 'sent';
        console.log(`✅ WhatsApp message sent successfully for job: ${job.id}`);
      } else {
        job.attempts++;
        if (job.attempts >= job.maxAttempts) {
          job.status = 'failed';
          console.error(`❌ Failed to send WhatsApp message after ${job.maxAttempts} attempts for job: ${job.id}`);
        } else {
          // Retry in 1 hour
          job.scheduledFor = new Date(Date.now() + 60 * 60 * 1000);
          console.log(`🔄 Retrying job ${job.id} in 1 hour (attempt ${job.attempts}/${job.maxAttempts})`);
        }
      }

      job.updatedAt = new Date();
      this.updateJob(job);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      job.attempts++;
      job.status = 'failed';
      job.updatedAt = new Date();
      this.updateJob(job);
    }
  }

  private async checkOverdueScreenings(): Promise<void> {
    try {
      console.log('🔍 Checking for overdue screenings...');

      const now = new Date();
      const overdueDate = new Date(now);
      overdueDate.setDate(overdueDate.getDate() - 1); // 1 day overdue

      // Check user screenings - we'll need to join with users and screenings
      const overdueUserScreenings = await db
        .select({
          userScreening: userScreenings,
          user: users,
          screening: screenings
        })
        .from(userScreenings)
        .innerJoin(users, eq(userScreenings.userId, users.id))
        .innerJoin(screenings, eq(userScreenings.screeningId, screenings.id))
        .where(and(
          lte(userScreenings.nextDue, overdueDate.toISOString()),
          eq(userScreenings.status, 'due')
        ));

      // Check family member screenings - we'll need to join with familyMembers and screenings
      const overdueFamilyScreenings = await db
        .select({
          familyScreening: familyMemberScreenings,
          familyMember: familyMembers,
          screening: screenings
        })
        .from(familyMemberScreenings)
        .innerJoin(familyMembers, eq(familyMemberScreenings.familyMemberId, familyMembers.id))
        .innerJoin(screenings, eq(familyMemberScreenings.screeningId, screenings.id))
        .where(and(
          lte(familyMemberScreenings.nextDue, overdueDate.toISOString()),
          eq(familyMemberScreenings.status, 'due')
        ));

      // Send overdue reminders
      for (const userScreening of overdueUserScreenings) {
        if (userScreening.user.phoneNumber) {
          await this.scheduleOverdueReminder(
            userScreening.userScreening.userId,
            userScreening.userScreening.screeningId,
            userScreening.user.name,
            userScreening.user.phoneNumber,
            userScreening.screening.name,
            userScreening.userScreening.nextDue
          );
        }
      }

      for (const familyScreening of overdueFamilyScreenings) {
        if (familyScreening.familyMember.phoneNumber) {
          await this.scheduleFamilyOverdueReminder(
            familyScreening.familyScreening.familyMemberId,
            familyScreening.familyScreening.screeningId,
            familyScreening.familyMember.name,
            familyScreening.familyMember.phoneNumber,
            familyScreening.screening.name,
            familyScreening.familyScreening.nextDue
          );
        }
      }

      console.log(`📤 Sent ${overdueUserScreenings.length + overdueFamilyScreenings.length} overdue reminders`);
    } catch (error) {
      console.error('Error checking overdue screenings:', error);
    }
  }

  private async scheduleOverdueReminder(
    userId: number,
    screeningId: number,
    personName: string,
    phoneNumber: string,
    screeningName: string,
    dueDate: string
  ): Promise<void> {
    const jobId = `overdue_${userId}_${screeningId}_${Date.now()}`;
    
    const job: NotificationJob = {
      id: jobId,
      type: 'overdue_reminder',
      userId,
      screeningId,
      phoneNumber,
      personName,
      screeningName,
      dueDate,
      scheduledFor: new Date(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storeJob(job);
  }

  private async scheduleFamilyOverdueReminder(
    familyMemberId: number,
    screeningId: number,
    personName: string,
    phoneNumber: string,
    screeningName: string,
    dueDate: string
  ): Promise<void> {
    const jobId = `family_overdue_${familyMemberId}_${screeningId}_${Date.now()}`;
    
    const job: NotificationJob = {
      id: jobId,
      type: 'overdue_reminder',
      familyMemberId,
      screeningId,
      phoneNumber,
      personName,
      screeningName,
      dueDate,
      scheduledFor: new Date(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storeJob(job);
  }

  // In-memory storage for jobs (replace with database in production)
  private jobs: Map<string, NotificationJob> = new Map();

  private storeJob(job: NotificationJob): void {
    this.jobs.set(job.id, job);
  }

  private updateJob(job: NotificationJob): void {
    this.jobs.set(job.id, job);
  }

  private getPendingJobs(): NotificationJob[] {
    return Array.from(this.jobs.values());
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 WhatsApp notification scheduler stopped');
  }
}

export default NotificationScheduler; 