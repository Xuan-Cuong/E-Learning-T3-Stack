"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { detectBot, fixedWindow } from "@arcjet/next";
import { headers } from "next/headers";

const aj = arcjet.withRule(
    detectBot({
        mode: "LIVE",
        allow: []
    })
)
.withRule(
    fixedWindow({
        mode: "LIVE",
        window: "1m",
        max: 5
    })
)

export async function CreateCourse(data: CourseSchemaType): Promise<ApiResponse> {
    const session = await requireAdmin();
    try {
        const validation = courseSchema.safeParse(data);

        if (!validation.success) {
            return { 
                status: "error",
                message: "Invalid Form data",
             };
        }
        await prisma.course.create({
            data: {
                title: validation.data.title,
                description: validation.data.description,
                fileKey: validation.data.fileKey,
                price: validation.data.price,
                duration: validation.data.duration,
                level: validation.data.level,
                categories: validation.data.category,
                smallDescription: validation.data.smallDescription,
                slug: validation.data.slug,
                status: validation.data.status,
                userId: session?.user.id as string,
            },
        });
        return {
            status: "success",
            message :"Course created successfully",
        }
    } catch(error){
        console.error('CreateCourse Error:', error);
        return {
            status: "error",
            message: "Failed to create course",
        };
    }
}