import { Injectable } from '@nestjs/common';
import { Employee } from '../database/entities/Employee.entity';

export interface CurrentUser {
  id: string;
  role: 'admin' | 'employer' | 'jobseeker';
  profileId?: string;
}

@Injectable()
export class PiiMaskingService {
  /**
   * Mask phone number showing only first 4 and last 2 digits
   * Example: "08012345678" -> "0801 **** 78"
   */
  maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) {
      return '****';
    }

    const first4 = phone.substring(0, 4);
    const last2 = phone.substring(phone.length - 2);
    return `${first4} **** ${last2}`;
  }

  /**
   * Mask email showing only first character and domain
   * Example: "john.doe@example.com" -> "j***@example.com"
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '****@****.***';
    }

    const [localPart, domain] = email.split('@');
    const firstChar = localPart.charAt(0);
    return `${firstChar}***@${domain}`;
  }

  /**
   * Determine if PII should be unmasked for the current user
   * Rules:
   * - Admins can always see unmasked PII
   * - Employers can see PII only if employee.piiUnlocked is true
   * - Job seekers can always see their own PII
   */
  shouldUnmaskForUser(employee: Employee, currentUser: CurrentUser): boolean {
    // Admin has full access
    if (currentUser.role === 'admin') {
      return true;
    }

    // Job seeker can see their own PII
    if (
      currentUser.role === 'jobseeker' &&
      employee.jobseekerProfileId === currentUser.profileId
    ) {
      return true;
    }

    // Employer can see PII only if unlocked
    if (
      currentUser.role === 'employer' &&
      employee.employerId === currentUser.profileId
    ) {
      return employee.piiUnlocked;
    }

    return false;
  }

  /**
   * Mask all PII fields in a jobseeker profile object
   */
  maskJobSeekerProfile(profile: any): any {
    if (!profile) return profile;

    return {
      ...profile,
      phoneNumber: profile.phoneNumber
        ? this.maskPhoneNumber(profile.phoneNumber)
        : null,
      email: profile.email ? this.maskEmail(profile.email) : null,
      // Keep other fields visible
    };
  }

  /**
   * Apply masking to employee entity based on user authorization
   */
  applyMaskingToEmployee(
    employee: Employee,
    currentUser: CurrentUser,
  ): Employee {
    if (this.shouldUnmaskForUser(employee, currentUser)) {
      return employee; // Return as-is if authorized
    }

    // Apply masking to nested jobseeker profile if present
    if (employee.jobseekerProfile) {
      employee.jobseekerProfile = this.maskJobSeekerProfile(
        employee.jobseekerProfile,
      );
    }

    return employee;
  }
}
