export const validateEmail = (email: string) : string | null => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailRegex.test(email)) {
        return "Email tidak valid"
    }
    return null
}

export const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Minimal 8 karakter";
    if (!/[A-Z]/.test(password)) return "Harus mengandung huruf kapital";
    if (!/[a-z]/.test(password)) return "Harus mengandung huruf kecil";
    if (!/[0-9]/.test(password)) return "Harus mengandung angka";
    return null;
  };
  
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    return password === confirmPassword ? null : "Password tidak cocok";
  };