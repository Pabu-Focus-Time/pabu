/**
 * EmailJS Service for sending session summaries
 * Integrates with EmailJS to send email notifications after sessions
 */

import emailjs from '@emailjs/browser';
import { SessionHistoryEntry, SessionUrl } from '@/types/session';

// EmailJS Configuration  
const EMAILJS_SERVICE_ID = 'default_service'; // You may need to update this with your actual service ID
const EMAILJS_TEMPLATE_ID = 'template_22d6p77'; // ✅ Correct template ID
const EMAILJS_PUBLIC_KEY = 'xv2DE15Oyl3o9N52v';
const EMAILJS_PRIVATE_KEY = 'ymUCZDsl-AsGQt31O1IiK';

// Initialize EmailJS
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
  privateKey: EMAILJS_PRIVATE_KEY,
});

export interface SessionEmailData {
  recipientEmail: string;
  childName: string;
  projectName: string;
  duration: string;
  startTime: string;
  endTime: string;
  urlsViewed: number;
  topSites: string;
  projectDescription?: string;
}

export class EmailService {
  /**
   * Send a session summary email after a session ends
   */
  static async sendSessionSummary(
    sessionData: SessionHistoryEntry,
    recipientEmail: string,
    childName: string
  ): Promise<boolean> {
    try {
      console.log('📧 Preparing to send session summary email...');
      
      // Format duration from milliseconds to readable format
      const durationMinutes = Math.floor(sessionData.duration / (1000 * 60));
      const durationSeconds = Math.floor((sessionData.duration % (1000 * 60)) / 1000);
      const durationText = `${durationMinutes}m ${durationSeconds}s`;

      // Format timestamps
      const startTimeText = sessionData.startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const endTimeText = sessionData.endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Prepare top sites list (top 5 by duration)
      const topSites = sessionData.urlsViewed
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(site => {
          const siteMinutes = Math.floor(site.duration / (1000 * 60));
          const siteSeconds = Math.floor((site.duration % (1000 * 60)) / 1000);
          const siteDuration = siteMinutes > 0 ? `${siteMinutes}m ${siteSeconds}s` : `${siteSeconds}s`;
          return `• ${site.title || site.url} - ${siteDuration}`;
        })
        .join('\n');

      // Prepare email template parameters
      const emailParams: SessionEmailData = {
        recipientEmail,
        childName,
        projectName: sessionData.projectName,
        duration: durationText,
        startTime: startTimeText,
        endTime: endTimeText,
        urlsViewed: sessionData.urlsViewed.length,
        topSites: topSites || 'No sites visited during this session',
        projectDescription: sessionData.summary || 'Learning session completed successfully'
      };

      console.log('📧 Sending email with data:', emailParams);

      // Send email via EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailParams
      );

      console.log('✅ Email sent successfully:', response);
      return true;

    } catch (error) {
      console.error('❌ Failed to send session summary email:', error);
      return false;
    }
  }

  /**
   * Test email functionality (useful for debugging)
   */
  static async testEmail(recipientEmail: string, childName: string): Promise<boolean> {
    const testSession: SessionHistoryEntry = {
      id: 'test-session',
      projectName: 'Test Project',
      projectId: 'test-project-id',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      endTime: new Date(),
      duration: 30 * 60 * 1000, // 30 minutes
      urlsViewed: [
        {
          url: 'https://example.com',
          title: 'Example Website',
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          duration: 20 * 60 * 1000 // 20 minutes
        },
        {
          url: 'https://test.com',
          title: 'Test Website',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          duration: 10 * 60 * 1000 // 10 minutes
        }
      ],
      summary: 'This is a test session to verify email functionality is working correctly.'
    };

    return this.sendSessionSummary(testSession, recipientEmail, childName);
  }

  /**
   * Validate email address format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email should be sent based on frequency setting
   */
  static shouldSendEmail(frequency: 'off' | 'after_each_session' | 'daily' | 'weekly'): boolean {
    switch (frequency) {
      case 'after_each_session':
        return true; // Always send for each session
      case 'daily':
        // TODO: Implement daily logic (check if already sent today)
        return false; // Not implemented yet
      case 'weekly':
        // TODO: Implement weekly logic (check if already sent this week)
        return false; // Not implemented yet
      case 'off':
      default:
        return false;
    }
  }
}

export { emailjs };