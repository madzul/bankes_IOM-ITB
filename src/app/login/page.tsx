"use client"

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-md mx-auto rounded-xl shadow-sm">
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            Selamat Datang di <span className="text-main">IOM</span>
          </h2>
          <p className="text-sm">
            Silahkan masuk dengan akun <span className="font-bold">microsoft untuk mahasiswa</span> dan akun{" "}
            <span className="font-bold">google untuk IOM</span>.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-left cursor-pointer"
            onClick={() => signIn("azure-ad", { callbackUrl: "/student/profile" })}
          >
            <div className="flex items-center">
              <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" className="mr-3">
                <path fill="#80cc28" d="M11.5 0h11.5v11.5h-11.5z"></path>
                <path fill="#f1511b" d="M0 0h11.5v11.5h-11.5z"></path>
                <path fill="#00adef" d="M0 11.5h11.5v11.5h-11.5z"></path>
                <path fill="#fbbc09" d="M11.5 11.5h11.5v11.5h-11.5z"></path>
              </svg>
              <span>Masuk dengan Microsoft | @mahasiswa.itb.ac.id</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-12 text-left cursor-pointer"
            onClick={() => router.push('/auth/login') }
          >
            <div className="flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-3">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                ></path>
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                ></path>
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                ></path>
              </svg>
              <span>Masuk dengan Google</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
