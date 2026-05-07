export interface EmailPayloadDto {
  recipient: string;
  subject?: string; // default is used if not provided
  templateType?: string;
  context: Record<string, unknown>;
  htmlContent?: string; // Pre-rendered HTML content
}

export interface EmailConfig {
  companyName: string;
  supportEmail: string;
  supportPhoneNumber: string;
  websiteUrl: string;
}
