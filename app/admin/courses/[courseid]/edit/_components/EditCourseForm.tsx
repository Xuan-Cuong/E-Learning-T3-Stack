"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CourseSchemaType, courseSchema, courseCategories, courseLevels, courseStatus } from "@/lib/zodSchemas";
import { editCourse } from "../actions";
import slugify from "slugify";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { SparkleIcon, Loader2, PencilIcon } from "lucide-react";
import { AdminCourseSingularType } from "@/app/data/admin/admin-get-course";

interface iAppProps {
    data: AdminCourseSingularType
}

export function EditCourseForm({ data }: iAppProps) {
    const [isPending, startEmailTransition] = useTransition();
    const router = useRouter();
    
    const form = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            title: data?.title || "",
            description: data?.description || "",
            fileKey: data?.fileKey || "",
            price: data?.price || 0,
            duration: data?.duration || 0,
            level: (data?.level as CourseSchemaType['level']) || "Beginner",
            category: (data?.categories as CourseSchemaType['category']) || "Health & Fitness",
            status: (data?.status as CourseSchemaType['status']) || "Draft",
            slug: data?.slug || "",
            smallDescription: data?.smallDescription || "",
        },
    });

    function onSubmit(values: CourseSchemaType) {
        startEmailTransition(async () => {
            try {
                const result = await editCourse(values, data.id);
                if (result?.status === "success") {
                    toast.success(result.message);
                    router.push("/admin/courses");
                } else if (result?.status === "error") {
                    toast.error(result.message);
                }
            } catch (error) {
                toast.error("An unexpected error occurred. Please try again.");
            }
        });
    }
    return (
        <Form {...form}>
            <form 
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4 items-end">
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Slug</FormLabel>
                                <FormControl>
                                    <Input placeholder="Slug" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="button" 
                        className="w-fit" 
                        onClick={() => {
                            const titleValue = form.getValues("title");
                            const slug = slugify(titleValue);
                            form.setValue("slug", slug, { shouldValidate: true });
                        }}
                    >
                        Generate Slug <SparkleIcon className="ml-1" size={16} />
                    </Button>
                </div>

                <FormField
                    control={form.control}
                    name="smallDescription"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Small Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Small Description" className="min-h-[120px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <RichTextEditor field={field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="fileKey"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Thumbnail image</FormLabel>
                            <FormControl>
                                <Uploader onChange={(value) => field.onChange(value)} value={field.value} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Category</FormLabel>
                                <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {courseCategories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Level</FormLabel>
                                <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {courseLevels.map((level) => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Duration (hours)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Duration" type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Price" type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Status</FormLabel>   
                            <Select 
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {courseStatus.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>
                    {isPending ? (
                        <>
                            Updating...
                            <Loader2 className="animate-spin ml-1" size={16} />
                        </>
                    ) : (
                        <>
                            Update Course
                            <PencilIcon className="ml-1" size={16} />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}