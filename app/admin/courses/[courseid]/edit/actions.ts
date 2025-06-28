"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import arcjet from "@/lib/arcjet";
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

export async function editCourse(data: CourseSchemaType, courseId: string): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Edit course - User:", user.user.id);
        console.log("Edit course - Course ID:", courseId);
        console.log("Edit course - Data:", data);

        const result = courseSchema.safeParse(data);

        if (!result.success) {
            console.log("Edit course - Validation errors:", result.error.errors);
            return {
                status: "error",
                message: "Invalid data: " + result.error.errors.map(e => e.message).join(", "),
            };
        }

        // Check if course exists and belongs to user
        const existingCourse = await prisma.course.findFirst({
            where: { 
                id: courseId,
                // Remove userId check for admin
            },
            select: { id: true, title: true }
        });

        if (!existingCourse) {
            console.log("Edit course - Course not found");
            return {
                status: "error",
                message: "Course not found",
            };
        }

        console.log("Edit course - Found existing course:", existingCourse);

        // Map category field correctly
        const updateData = {
            title: result.data.title,
            description: result.data.description,
            fileKey: result.data.fileKey,
            price: result.data.price,
            duration: result.data.duration,
            level: result.data.level,
            categories: result.data.category, // Map category to categories
            status: result.data.status,
            slug: result.data.slug,
            smallDescription: result.data.smallDescription,
        };

        console.log("Edit course - Update data:", updateData);

        const updatedCourse = await prisma.course.update({
            where: { 
                id: courseId,
            },
            data: updateData,
        });
        
        console.log("Edit course - Updated successfully:", updatedCourse.id);
        
        // Revalidate cache
        revalidatePath("/admin/courses");
        revalidatePath(`/admin/courses/${courseId}/edit`);
        
        return {
            status: "success",
            message: "Course updated successfully",
        };

    } catch (error) {
        console.error("Edit course - Error:", error);
        return {
            status: "error",
            message: "Failed to update Course: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}

export async function reorderLessons(
    chapterId: string,
    lessons: { id: string; position: number }[],
    courseId : string
): Promise<ApiResponse> {
    try {
        if(!lessons || lessons.length === 0) {
            return {
                status: "error",
                message: "No lessons provided for reordering",
            };
        }
        const updates = lessons.map((lesson) => prisma.lesson.update({
            where: { id: lesson.id, chapterId: chapterId },
            data: { position: lesson.position },
        }));

    await prisma.$transaction(updates);

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
        status: "success",
        message: "Lessons reordered successfully",
    };
    } catch {
        return{
            status: "error",
            message: "Failed to reorder lessons: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}
// Export function for course editing

// Chapter management actions
export async function createChapter(courseId: string, title: string): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Create chapter - User:", user.user.id);
        console.log("Create chapter - Course ID:", courseId);
        console.log("Create chapter - Title:", title);

        if (!title.trim()) {
            return {
                status: "error",
                message: "Chapter title is required",
            };
        }

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { 
                id: true,
                chapters: {
                    select: { position: true },
                    orderBy: { position: 'desc' },
                }
            }
        });

        if (!course) {
            return {
                status: "error",
                message: "Course not found",
            };
        }

        // Get next position - fix the logic
        const nextPosition = course.chapters.length > 0 ? Math.max(...course.chapters.map(ch => ch.position)) + 1 : 1;

        const chapter = await prisma.chapter.create({
            data: {
                title: title.trim(),
                position: nextPosition,
                courseId: courseId,
            },
        });
        
        console.log("Create chapter - Created successfully:", chapter.id);
        
        // Revalidate cache
        revalidatePath(`/admin/courses/${courseId}/edit`);
        
        return {
            status: "success",
            message: "Chapter created successfully",
        };

    } catch (error) {
        console.error("Create chapter - Error:", error);
        return {
            status: "error",
            message: "Failed to create chapter: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}

export async function updateChapter(chapterId: string, title: string): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Update chapter - User:", user.user.id);
        console.log("Update chapter - Chapter ID:", chapterId);
        console.log("Update chapter - Title:", title);

        if (!title.trim()) {
            return {
                status: "error",
                message: "Chapter title is required",
            };
        }

        const chapter = await prisma.chapter.update({
            where: { id: chapterId },
            data: { title: title.trim() },
        });
        
        console.log("Update chapter - Updated successfully:", chapter.id);
        
        // Revalidate cache
        revalidatePath(`/admin/courses/${chapter.courseId}/edit`);
        
        return {
            status: "success",
            message: "Chapter updated successfully",
        };

    } catch (error) {
        console.error("Update chapter - Error:", error);
        return {
            status: "error",
            message: "Failed to update chapter: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}

export async function deleteChapter(chapterId: string): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Delete chapter - User:", user.user.id);
        console.log("Delete chapter - Chapter ID:", chapterId);

        // Get chapter info before deletion
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: { 
                courseId: true,
                lessons: {
                    select: { id: true }
                }
            }
        });

        if (!chapter) {
            return {
                status: "error",
                message: "Chapter not found",
            };
        }

        console.log("Chapter has lessons:", chapter.lessons.length);

        // With cascade delete in schema, this will automatically delete lessons
        await prisma.chapter.delete({
            where: { id: chapterId }
        });
        
        console.log("Delete chapter - Deleted successfully:", chapterId);
        
        // Revalidate cache
        revalidatePath(`/admin/courses/${chapter.courseId}/edit`);
        
        return {
            status: "success",
            message: `Chapter and ${chapter.lessons.length} lesson(s) deleted successfully`,
        };

    } catch (error) {
        console.error("Delete chapter - Error:", error);
        return {
            status: "error",
            message: "Failed to delete chapter: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}

export async function reorderChapters(courseId: string, chapterIds: string[]): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Reorder chapters - User:", user.user.id);
        console.log("Reorder chapters - Course ID:", courseId);
        console.log("Reorder chapters - Chapter IDs:", chapterIds);

        // Update positions
        const updates = chapterIds.map((chapterId, index) => 
            prisma.chapter.update({
                where: { id: chapterId },
                data: { position: index + 1 },
            })
        );

        await prisma.$transaction(updates);
        
        console.log("Reorder chapters - Reordered successfully");
        
        // Revalidate cache
        revalidatePath(`/admin/courses/${courseId}/edit`);
        
        return {
            status: "success",
            message: "Chapters reordered successfully",
        };

    } catch (error) {
        console.error("Reorder chapters - Error:", error);
        return {
            status: "error",
            message: "Failed to reorder chapters: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}

export async function deleteLesson(lessonId: string): Promise<ApiResponse> {
    try {
        const user = await requireAdmin();
        
        console.log("Delete lesson - User:", user.user.id);
        console.log("Delete lesson - Lesson ID:", lessonId);

        // Get lesson info before deletion
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { 
                chapterId: true,
                chapter: {
                    select: { courseId: true }
                }
            }
        });

        if (!lesson) {
            return {
                status: "error",
                message: "Lesson not found",
            };
        }

        await prisma.lesson.delete({
            where: { id: lessonId }
        });
        
        console.log("Delete lesson - Deleted successfully:", lessonId);
        
        // Revalidate cache
        revalidatePath(`/admin/courses/${lesson.chapter.courseId}/edit`);
        
        return {
            status: "success",
            message: "Lesson deleted successfully",
        };

    } catch (error) {
        console.error("Delete lesson - Error:", error);
        return {
            status: "error",
            message: "Failed to delete lesson: " + (error instanceof Error ? error.message : "Unknown error"),
        };
    }
}