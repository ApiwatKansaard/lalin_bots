import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          อีเมลของคุณไม่ได้รับอนุญาตให้เข้าใช้ระบบ กรุณาติดต่อผู้ดูแลระบบ
        </p>
        <Link
          href="/login"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
