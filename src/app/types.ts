export type ApiKeyTestResult = {
  success: boolean;
  status: 'valid' | 'invalid' | 'rate-limited';
  error?: string;
};
