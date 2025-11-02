export interface CandidateProfile {
  candidateID: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  linkedInProfile: string;
  address: string;
  dateOfBirth: Date | null;
  gender: string;
  status: string;
  resumeURL: string;
  createdDate: Date;
  updatedDate: Date;
  graduationYear: number;
  college: string;
  course: string;
  currentSemester?: string; // Optional field for current semester
  emailNotifications?: boolean;
  jobApplicationUpdates?: boolean;
  interviewReminders?: boolean;
  marketingCommunications?: boolean;
}

// Interface for sending data to backend (matches C# model exactly)
export interface CandidateProfileDto {
  CandidateID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  LinkedInProfile: string;
  Address: string;
  DateOfBirth: string | null; // ISO string format or null
  Gender: string;
  Status: string;
  ResumeURL: string;
  CreatedDate: string; // ISO string format
  UpdatedDate: string; // ISO string format
  GraduationYear: number;
  College: string;
  Course: string;
  CurrentSemester: string;
  EmailNotifications: boolean;
  JobApplicationUpdates: boolean;
  InterviewReminders: boolean;
  MarketingCommunications: boolean;
}
