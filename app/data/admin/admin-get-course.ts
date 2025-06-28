import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";
import { id } from "zod/v4/locales";
import { notFound } from "next/navigation";

export async function adminGetCourse(id: string) {
    await requireAdmin()
    const data = await prisma.course.findUnique({
        where: {
            id: id 
        },
        select: {
            id: true,
            title: true,
            description: true,
            fileKey: true,
            price : true,
            duration: true,
            slug: true,
            smallDescription: true,
            categories: true,
            level: true,
            status: true,
            chapters: {
                select: {
                    id: true,
                    title: true,
                    position: true,
                        lessons: {
                        select: {
                            id: true,
                            title: true,
                            discription: true,
                            thumbnail: true,
                            position: true,
                            videoKey: true,
                        },
                        orderBy: { position: 'asc' }
                    }
                },
                orderBy: { position: 'asc' }
            }
        }
    });
    if(!data){
        return notFound();
    }
    return data;
}

export type AdminCourseSingularType = Awaited<ReturnType<typeof adminGetCourse>>;