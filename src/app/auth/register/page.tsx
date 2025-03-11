'use client'
import { useState, useEffect } from "react"
import {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
} from "@/utils/_validation"


type Errors = {
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string[]
  }


export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      })
    const [errors, setErrors] = useState<Errors>({})

    const validateForm = (): Errors => {
        const newErrors: Errors = {}
        
        // Name validation
        if (!formData.name.trim()) {
          newErrors.name = "Nama wajib diisi"
        }

        // Email validation
        const emailError = validateEmail(formData.email)
        if (emailError) newErrors.email = emailError
        
        // Password validation
        const passwordError = validatePassword(formData.password)
        if (passwordError) newErrors.password = passwordError
        
        // Confirm password validation
        const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword)
        if (confirmError) newErrors.confirmPassword = confirmError
        
        return newErrors
      }
      
      useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const timer = setTimeout(() => {
                setErrors({})
            }, 3000)
            
            return () => clearTimeout(timer)
        }
      }, [errors])

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        const validationErrors = validateForm()
        setErrors(validationErrors)
        
        if (Object.keys(validationErrors).length === 0) {
          console.log("Form valid, submitting...")
        }
      }
  
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
          ...formData,
          [e.target.name]: e.target.value
        })
        
        setErrors(prev => ({
          ...prev,
          [e.target.name]: undefined
        }))
    }
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
                    Registrasi
                </h1>
                
                {/* Error Summary
                {Object.values(errors).filter(e => e).length > 0 && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <ul className="list-disc pl-5">
                      {Object.entries(errors).map(([field, msg]) => 
                        msg && <li key={field}>{msg}</li>
                      )}
                    </ul>
                  </div>
                )} */}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Lengkap
                        </label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            placeholder="Masukkan nama lengkap"
                            aria-describedby="name-error"
                        />
                        {errors.name && (
                          <p id="name-error" className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            placeholder="Masukkan email"
                            aria-describedby="email-error"
                        />
                        {errors.email && (
                          <p id="email-error" className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            placeholder="Masukkan password"
                            aria-describedby="password-error"
                        />
                        {errors.password && (
                          <p id="password-error" className="text-red-500 text-sm mt-1">
                            {errors.password}
                          </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Konfirmasi Password
                        </label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            placeholder="Konfirmasi password"
                            aria-describedby="confirm-error"
                        />
                        {errors.confirmPassword && (
                          <p id="confirm-error" className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                        Daftar
                    </button>

                    <div className="text-center">
                        <span className="text-gray-600 mr-2">Sudah punya akun?</span>
                        <a href="/auth/login" className="text-blue-500 hover:underline">
                            Login disini
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}