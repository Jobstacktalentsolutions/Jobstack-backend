// Export employer DTOs (new naming)
export * from './update-employer-profile.dto';
export * from './get-all-employers-query.dto';
export * from './employer-verification.dto';
export * from './upload-employer-verification-document.dto';

// Export legacy recruiter DTOs (for backward compatibility during transition)
export { UpdateEmployerProfileDto as UpdateRecruiterProfileDto } from './update-recruiter-profile.dto';
export { GetAllEmployersQueryDto as GetAllRecruitersQueryDto } from './get-all-recruiters-query.dto';
export { EmployerVerificationDto as RecruiterVerificationDto } from './recruiter-verification.dto';
export { UploadEmployerVerificationDocumentDto as UploadVerificationDocumentDto } from './upload-verification-document.dto';

// Export shared DTOs
export * from './update-verification.dto';
export * from './uuid-param.dto';
export * from './admin-verification.dto';
