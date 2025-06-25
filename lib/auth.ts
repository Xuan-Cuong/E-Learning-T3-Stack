import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins"
import { Html } from "next/document";
import { resend } from "./resend";
 
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders:{
        github:{
            clientId: env.AUTH_GITHUB_CLIENT_ID,
            clientSecret: env.AUTH_GITHUB_SECRET,
        },
    },

    plugins:[
        emailOTP({
            async sendVerificationOTP({ email, otp}){
               await resend.emails.send({
                from: 'SatoriWave AI <onboarding@resend.dev>',
                to: [email],
                subject: 'SatoriWave AI - Verify Your Email',
                html: `<p>Your OTP is <strong>${otp}<strong> </p>`,
            });
            }
        }),
    ],
});
