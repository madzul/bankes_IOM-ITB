'use client'
import { useState, useEffect } from "react"
import { validateEmail } from "@/utils/_validation"

type Errors = {
    email?: string
    password?: string
    general?: string[]
}

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [errors, setErrors] = useState<Errors>({})
    const [isLoading, setIsLoading] = useState(false)

    const validateForm = (): Errors => {
        const newErrors: Errors = {}
        
        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email wajib diisi"
        } else {
            const emailError = validateEmail(formData.email)
            if (emailError) newErrors.email = emailError
        }

        // Password validation
        if (!formData.password.trim()) {
            newErrors.password = "Password wajib diisi"
        } 

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        
        const validationErrors = validateForm()
        setErrors(validationErrors)
        
        if (Object.keys(validationErrors).length === 0) {
            try {
                /**
                 * TODO: Call login API here
                 */
                console.log("Form valid, submitting...")
            } catch (error) {
                setErrors(prev => ({
                    ...prev,
                    general: ["Terjadi kesalahan saat login"]
                }))
            } finally {
                setIsLoading(false)
            }
        } else {
            setIsLoading(false)
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
                    Login
                </h1>
                
                {/* Error Summary */}
                {/* {(errors.general || Object.values(errors).some(e => e)) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        {errors.general?.map((msg, i) => (
                            <p key={i}>{msg}</p>
                        ))}
                        {Object.entries(errors).map(([field, msg]) => 
                            field !== 'general' && msg && <p key={field}>{msg}</p>
                        )}
                    </div>
                )} */}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email"
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
                            id="password"
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

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-200 
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>

                    <div className="text-center">
                        <a href="#" className="text-sm text-blue-500 hover:underline">
                            Lupa Password?
                        </a>
                    </div>

                    <div className="text-center">
                        <span className="text-sm text-gray-600 mr-2">
                            Belum punya akun? 
                        </span>
                        <a href="/auth/register" className="text-sm text-blue-500 hover:underline">
                            Registrasi
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}