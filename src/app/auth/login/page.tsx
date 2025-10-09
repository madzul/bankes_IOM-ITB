'use client'
import { useState, useEffect } from "react"
import { validateEmail } from "@/utils/_validation"
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner";

type Errors = {
    email?: string
    password?: string
    generalError?: string
}

export default function LoginPage() {
    const router = useRouter()
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [errors, setErrors] = useState<Errors>({})
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = (): Errors => {
        const newErrors: Errors = {}
        
        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else {
            const emailError = validateEmail(formData.email)
            if (emailError) newErrors.email = emailError
        }

        // Password validation
        if (!formData.password.trim()) {
            newErrors.password = "Password is required"
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

    const redirect = async () => {
        if (session?.user?.id) {
            const response = await fetch(`/api/users`);
            if (response.ok) {
                const user = await response.json();
                const userrole : string = user.role;
                const roleBasedCallbackUrls : { [key: string] : string }  = {
                    Mahasiswa : "student/profile",
                    "Admin" : "/admin/account/",
                    "Pengurus_IOM" : "/iom/document/",
                    "Guest" : "/guest/",
                    "Pewawancara": "/interviewer/interview/"
                };
                const callbackUrl : string = roleBasedCallbackUrls[userrole];

                router.push(callbackUrl);
            }
        }
    }

    useEffect(() => {
        redirect();
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        
        const validationErrors = validateForm()
        setErrors(validationErrors)
        
        if (Object.keys(validationErrors).length === 0) {
            try {
                // Extract email and password from formData
                const { email, password } = formData;

                // Trigger the credentials provider login
                // const profile: Profile = {
                //     email: email,
                //     password: password,
                //     redirect: false,
                // }
                
                const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    setErrors({generalError: "Email or password incorrect"})
                }
            } catch (error) {
                // console.error("Error during signIn:", error);
                // console.log("Error during signIn:", error);
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
        <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md my-[5%]">
                <h1 className="text-2xl font-bold mb-2 text-center text-var">
                    Masuk ke Akun Anda
                </h1>

                <div className="text-center font-normal mb-4">
                    <span className="text-sm mr-1">
                        Belum punya akun? 
                    </span>
                    <Link href="/auth/register" className="text-sm text-var font-bold hover:underline">
                        Daftar
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
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
                            placeholder="example@email.com"
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
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-black
                                    ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                placeholder="Masukkan Password"
                                aria-describedby="password-error"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label={!showPassword ? "Show password" : "Hide password"}
                            >
                                {!showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-red-500 text-sm mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>
                    
                    <div className="">
                        {errors.generalError && (
                            <p id="email-error" className="text-red-500 text-sm my-2">
                                {errors.generalError}
                            </p>
                        )}
                        <Link href="#" className="text-sm text-var font-bold hover:underline">
                            Lupa password?
                        </Link>
                    </div>

                    
                    <div className="flex">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className={`mx-auto bg-var text-white py-2 px-4 rounded-lg transition duration-200 
                                ${isLoading ? 'opacity-90 cursor-not-allowed' : 'hover:bg-var/90 cursor-pointer'}`}
                        >
                            {isLoading ? 'Loading...' : 'Masuk'}
                        </button>
                    </div>

                    <div className="text-center font-normal mb-4">
                        <span className="text-sm mr-1">
                            Butuh bantuan?
                        </span>
                        <Link href="/auth/register" className="text-sm text-var font-bold hover:underline">
                            Hubungi kami
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}