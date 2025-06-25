"use server";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";


export async function CreateCourse(data: CourseSchemaType): Promise<ApiResponse> {
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
                ...validation.data,
                userId: "some-user-id",
                categories: validation.data.category,
            },
        });
        return {
            status: "success",
            message :"Course created successfully",
        }
    } catch{
        return {
            status: "error",
            message: "Failed to create course",
        };
    }
}