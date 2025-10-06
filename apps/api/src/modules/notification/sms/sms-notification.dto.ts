export interface SmsPayloadDto {
  recipient: string; // E.164 phone number
  body: string; // Message content
}

export interface SmsConfig {
  fromNumber: string; // E.164 sender number
}
