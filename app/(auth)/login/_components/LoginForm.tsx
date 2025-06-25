"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { GithubIcon, Loader, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function LoginForm() {
    const router = useRouter();
    const [githubPending, startGithubTransition] = useTransition();
    const [emailPending, startEmailTransition] = useTransition();
    const [email, setEmail] = useState('');

    async function signInwithGithub() {
        startGithubTransition(async () => {
            await authClient.signIn.social({
                provider: 'github',
                callbackURL: "/",
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Signed in with Github, you will be redirected...");
                    },
                    onError: (error) => {
                        toast.error("Internal Server Error");
                    },
                },
            });
        });
    }

    async function signInwithEmail() {
        startEmailTransition(async () => {
            await authClient.emailOtp.sendVerificationOtp({
                email: email,
                type: 'sign-in',                fetchOptions: {
                    onSuccess: () => {
                        toast.success('Email sent');
                        router.push(`/verify-request?email=${email}`);
                    }
                }
            });        });
    }

    return (
        <Card className="w-[400px] mx-auto mt-32">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>Login with your GitHub or Email Account</CardDescription>
            </CardHeader>
      
            <CardContent className="flex flex-col gap-4">
                <Button
                    disabled={githubPending} 
                    onClick={signInwithGithub} 
                    className="w-full" 
                    variant="outline"
                >
                    {githubPending ? (
                        <>
                            <Loader className="size-4 animate-spin" />
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>
                            <GithubIcon className="size-4 mr-2" />
                            Sign in with GitHub
                        </>
                    )}
                </Button>
      
                <div className="relative text-center text-sm text-muted-foreground">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <span className="relative z-10 bg-background px-2">Or continue with</span>
                </div>
      
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            type="email" 
                            placeholder="m@example.com" 
                        />
                    </div>
      
                    <Button onClick={signInwithEmail} disabled={emailPending} className="w-full">
                        {emailPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <Send className="size-4"/>
                                <span>Continue with Email</span>
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}