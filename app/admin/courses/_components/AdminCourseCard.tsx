import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {  useConstructUrl } from "@/hooks/use-construct";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ArrowRight, Eye, MoreVertical, Pencil, School, TimerIcon, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


interface iAppProps {
    data: AdminCourseType;
}

export function AdminCourseCard({ data }: iAppProps){
    const thumbnailUrl = useConstructUrl(data.fileKey);
    return (
        <Card className="group relative py-0 gap-0 ">
            {/* absolute dropdown */}
            <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <MoreVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${data.id}/edit`}>
                                <Pencil className="size-4" />
                                Edit Course
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${data.slug}`}>
                                <Eye className="size-4 mr-2" />
                                Preview
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${data.id}/delete`}>
                                <Trash className="size-4 mr-2 text-destructive" />
                                Delete Course
                            </Link>
                        </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* Image container */}
            <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
                <Image 
                    src={thumbnailUrl} 
                    alt="Thumbnail Url" 
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
            </div>
            
            {/* Content */}
            <CardContent className="p-4">
                <Link 
                    href={`/admin/courses/${data.id}/edit`} 
                    className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
                >   
                    {data.title}
                </Link>
                <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">{data.smallDescription}</p>
                
                <div className="mt-4 flex items-center gap-x-4">
                    <div className="flex items-center gap-x-2">
                        <TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
                        <span className="text-sm text-muted-foreground">{data.duration}h</span>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
                        <span className="text-sm font-medium text-primary">{data.level}</span>
                    </div>
                </div>
                <Link className={buttonVariants({
                    className: "w-full mt-4",
                })} href={`/admin/courses/${data.id}/edit`}>
                    Edit Course <ArrowRight className="size-4" />
                </Link>
            </CardContent>
        </Card>
    )
}
