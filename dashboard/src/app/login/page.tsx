"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">ลาลิน แอดมิน</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          เข้าสู่ระบบด้วย Google เพื่อจัดการหมู่บ้าน
        </p>
        <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          เข้าสู่ระบบด้วย Google
        </Button>
      </div>
    </div>
  );
}
