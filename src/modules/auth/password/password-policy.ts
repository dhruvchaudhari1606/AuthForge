export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Requires at least one uppercase letter, one lowercase letter, one number, and one special character
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,128}$/;

export const PASSWORD_RULE_MESSAGE =
  'Password must be between 8 and 128 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
