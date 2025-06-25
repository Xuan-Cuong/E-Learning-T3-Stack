"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSignOut(){
    const router = useRouter();
    const handleSignOut = async function SignOut() {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/login");
              toast.success("Signed out Successfully");
            },
            onError: () => {
              toast.error("Sign out failed");
            },
              },
            });
          }
    return handleSignOut ;
}