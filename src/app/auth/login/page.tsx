'use client'
import { useState } from "react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
                    Login
                </h1>
                
                <form className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Masukkan email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Masukkan password"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                        Login
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