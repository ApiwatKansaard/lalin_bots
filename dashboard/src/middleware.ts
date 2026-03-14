export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/payments/:path*",
    "/overdue/:path*",
    "/houses/:path*",
    "/settings/:path*",
  ],
};
