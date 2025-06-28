
import "server-only"; 
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/dist/server/request/headers";

export async function requireAdmin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return redirect("/login");
    }
    if (session.user.role !== "admin") {
        return redirect("/not-admin");
    }
    return session; 
}