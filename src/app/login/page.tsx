"use client";

import { SessionProvider } from "next-auth/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginComponent />
    </SessionProvider>
  );
}

function LoginComponent() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {session ? (
        <>
          <p>Welcome, {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <button onClick={() => signIn("azure-ad")}>Sign in with Microsoft</button>
      )}
    </div>
  );
}
