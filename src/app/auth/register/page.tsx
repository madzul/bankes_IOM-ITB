"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { validateEmail, validatePassword, validatePasswordMatch } from "@/utils/_validation"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

type Errors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string[]
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)

  const validateForm = (): Errors => {
    const newErrors: Errors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
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

    if (!agreedToTerms) {
      newErrors.general = ["Anda perlu menyetujui Syarat dan Ketentuan"]
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

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      try {
        // api call
        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        /**
         * need to work on this part
         * i don't know why it's not working in client-side
         * but it's working on the server-side or event network tab in developer mode
         */
        if (response.ok) {
          router.push("/auth/login")
        }

        const data = await response.json()
        if (!response.ok) {
          if (data.name) setErrors({ name: data.name })
          if (data.email) setErrors({ email: data.email })
          if (data.password) setErrors({ password: data.password })
          if (data.confirmPassword) setErrors({ confirmPassword: data.confirmPassword })
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: [`An error occurred. Please try again later.\n ${error}`],
        }))
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }))
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md my-[5%]">
        <h1 className="text-2xl font-bold mb-2 text-center text-var">Daftarkan Akun Anda</h1>

        <div className="text-center font-normal mb-4">
          <span className="text-sm mr-1">Sudah punya akun?</span>
          <Link href="/auth/login" className="text-sm text-var font-bold hover:underline">
            Masuk
          </Link>
        </div>

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
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              placeholder="John Doe"
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
            <label htmlFor="email" className="block text-sm font-mediummb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              placeholder="johndoe@gmail.com"
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
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.password ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              placeholder="Masukkan Password"
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Konfirmasi Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black
                              ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              placeholder="Konfirmasi Password"
              aria-describedby="confirm-error"
            />
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Saya setuju dengan{" "}
                <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-var font-bold hover:underline" type="button">
                      Syarat dan Ketentuan
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Syarat dan Ketentuan</DialogTitle>
                      <DialogDescription>Berlaku sejak 17 Mei 2025</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-sm">
                      <h3 className="font-bold">1. Privasi</h3>
                      <p>
                        Saya menyutujui bahwa data yang diberikan kepada saya melalui website ini bersifat rahasia dan tidak untuk disebarkan ke pihak yang tidak berwenang
                      </p>
                    </div>
                    <DialogClose className="">
                      <button className="bg-var hover:bg-var/90 text-white py-2 px-4 rounded-lg transition duration-200">
                        Tutup
                      </button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </label>
              {errors.general && <p className="text-red-500 text-sm">{errors.general[0]}</p>}
            </div>
          </div>

          <div className="flex">
            <button
              type="submit"
              className="mx-auto bg-var hover:bg-var/90 cursor-pointer text-white py-2 px-4 rounded-lg transition duration-200"
            >
              Sign up
            </button>
          </div>

          <div className="text-center font-normal mb-4">
            <span className="text-sm mr-1">Butuh bantuan?</span>
            <Link href="/auth/register" className="text-sm text-var font-bold hover:underline">
              Hubungi kami
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}