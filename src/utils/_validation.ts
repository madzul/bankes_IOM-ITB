export const validateEmail = (email: string) : string | null => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Email not valid ";
  }
  return null;
}

export const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must be an uppercase letter";
    if (!/[a-z]/.test(password)) return "Must be a lowercase letter";
    if (!/[0-9]/.test(password)) return "Must be a number";
    return null;
  };
  
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    return password === confirmPassword ? null : "Passwords do not match";
  };