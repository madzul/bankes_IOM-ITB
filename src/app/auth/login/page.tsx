'use client'
import { useState, useEffect } from "react"
import { validateEmail } from "@/utils/_validation"
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"

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
                    alert(result.error);
                }
            } catch (error) {
                console.error("Error during signIn:", error);
                console.log("Error during signIn:", error);
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
        <div className="flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
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
                
                {/* Error Summary */}
                {errors.generalError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center" role="alert">
                    {errors.generalError}
                </div>
                )}

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
                        <input 
                            type="password" 
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                                ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            placeholder="Masukkan Password"
                            aria-describedby="password-error"
                        />
                        {errors.password && (
                            <p id="password-error" className="text-red-500 text-sm mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>
                    
                    <div className="">
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