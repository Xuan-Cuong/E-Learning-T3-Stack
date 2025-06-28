"use client";
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DndContext, DraggableSyntheticListeners, KeyboardSensor, PointerSensor, rectIntersection, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ReactNode, useState, useTransition } from "react";
import { AdminCourseSingularType } from '@/app/data/admin/admin-get-course';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, GripVertical, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createChapter, updateChapter, deleteChapter, reorderChapters, deleteLesson } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface iAppProps{
    data: AdminCourseSingularType;
    courseId: string;
}

interface SortableItemProps {
  id : string;
  children : (listeners: DraggableSyntheticListeners) =>ReactNode;
  className?: string;
  data? :{
    type?: 'chapter' | 'lesson';
    chapterId?: string; //only relevant for lessons
    
  }
}

export function CourseStructure({data, courseId}: iAppProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [isAddingChapter, setIsAddingChapter] = useState(false);
    const [editingChapter, setEditingChapter] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const initialItems = data.chapters.map((chapter) => {
        return {
            id: chapter.id,
            title: chapter.title,
            order: chapter.position,
            isOpen: true, //default chapters to open
            lessons: chapter.lessons.map(lesson => {
                return {
                    id: lesson.id,
                    title: lesson.title,
                    order: lesson.position,
                    chapterId: chapter.id,
                }
            })
        }
    });

    const [items, setItems] = useState(initialItems);

    console.log(items)

    // Get all sortable items (chapters + lessons)
    const allSortableItems = [
        ...items.map(chapter => chapter.id),
        ...items.flatMap(chapter => chapter.lessons.map(lesson => lesson.id))
    ];

    function SortableItem({children, id, className, data}: SortableItemProps) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({id: id, data: data});

        const style = {
            transform: CSS.Transform.toString(transform),
            transition: isDragging ? 'none' : transition,
        };
        
        return (
            <div 
                ref={setNodeRef} 
                style={style} 
                {...attributes} 
                className={cn(
                    "touch-none transition-all duration-200 ease-in-out", 
                    className, 
                    isDragging ? "z-50 opacity-90 scale-105 shadow-lg" : "opacity-100 scale-100"
                )}
            >
                {children(listeners)}
            </div>
        );
    }

    function handleDragEnd(event: any) {
        const {active, over} = event;
        
        if (!over || active.id === over.id) {
            return;
        }
        const activeId = active.id;
        const overId = over.id;
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
        const courseId = data.id;

        if (activeType === "chapter"){
            let targetChapterId = null;

            if(overType === "chapter"){
                targetChapterId = overId;
            }
            else if (overType === "lesson") {
                targetChapterId = over.data.current?.chapterId ?? null
            }

            if(!targetChapterId) {
                toast.error("Could not determine the chapter for reordering");
                return;
            }

            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex((item) => item.id === targetChapterId);

            if(oldIndex === -1 || newIndex === -1) {
                toast.error("Could not find chapter old/new index for reordering");
                return;
            }

            const reordedLocalChapter = arrayMove(items, oldIndex, newIndex);
            
            const updatedChapterForState = reordedLocalChapter.map((chapter, index) => ({
                ...chapter,
                order: index + 1,
            }));
            const previousItems = [...items];
            setItems(updatedChapterForState);
        }

        if(activeType === "lesson" && overType ==="lesson") {
            const chapterId = active.data.current?.chapterId;
            const overChapterId = over.data.current?.chapterId;

            if( !chapterId || chapterId !== overChapterId) {
                toast.error("Lesson move between different chapters or invalid chapter ID is not allowed");
                return;
            }
        
            const chapterIndex = items.findIndex((chapter) => chapter.id === chapterId);
            if (chapterIndex === -1) {
                toast.error("Could not find chapter for lesson");
                return;
            }

            const chapterToUpdate = items[chapterIndex];

            const oldLessonIndex = chapterToUpdate.lessons.findIndex(
                (lesson) => lesson.id === activeId
            );

            const newLessonIndex = chapterToUpdate.lessons.findIndex(
                (lesson) => lesson.id === overId
            );

            if( oldLessonIndex === -1 || newLessonIndex === -1) {
                toast.error("Could not find lesson for reordering");
                return;
            }

            const reorderedLessons = arrayMove(
                chapterToUpdate.lessons, 
                oldLessonIndex, 
                newLessonIndex
            );

            const updatedLessonForState = reorderedLessons.map((lesson, index) => ({
                ...lesson,
                order: index + 1,
            }));

            const newItems = [...items];
            newItems[chapterIndex] = {
                ...chapterToUpdate,
                lessons: updatedLessonForState,
            };

            const previousItems = [...items];
            setItems(newItems);

            if(courseId){
                const lessonToUpdate = updatedLessonForState.map((lesson) => ({
                    id: lesson.id,
                    position: lesson.order,
                }));
            
            const reorderLessonsPromise = () => reorderLessons(
                chapterId,
                lessonToUpdate,
                courseId
            );
            toast.promise(reorderLessonsPromise(), {
                loading: "Reordering lessons...",
                success: (result: any) => {
                    if(result.status === "success") 
                        return result.message;
                    throw new Error(result.message);
                },
                error: () => {
                    setItems(previousItems);
                    return "Failed to reorder lessons";
                }
            });
        }
        return;
    }
    function handleCreateChapter() {
        if (!newChapterTitle.trim()) {
            toast.error("Chapter title is required");
            return;
        }

        startTransition(async () => {
            const result = await createChapter(courseId, newChapterTitle);
            if (result.status === "error") {
                toast.error(result.message);
            } else {
                toast.success("Chapter created successfully");
                setNewChapterTitle("");
                setIsAddingChapter(false);
                router.refresh();
            }
        });
    }

    function handleEditChapter(chapterId: string) {
        if (!editTitle.trim()) {
            toast.error("Chapter title is required");
            return;
        }

        startTransition(async () => {
            const result = await updateChapter(chapterId, editTitle);
            if (result.status === "error") {
                toast.error(result.message);
            } else {
                toast.success("Chapter updated successfully");
                setEditingChapter(null);
                setEditTitle("");
                router.refresh();
            }
        });
    }

    function handleDeleteChapter(chapterId: string) {
        const chapter = items.find(item => item.id === chapterId);
        const lessonsCount = chapter?.lessons.length || 0;
        
        const message = lessonsCount > 0 
            ? `Are you sure you want to delete this chapter and ${lessonsCount} lesson(s)? This action cannot be undone.`
            : "Are you sure you want to delete this chapter? This action cannot be undone.";
            
        if (!confirm(message)) {
            return;
        }

        startTransition(async () => {
            const result = await deleteChapter(chapterId);
            if (result.status === "error") {
                toast.error(result.message);
            } else {
                toast.success(result.message);
                router.refresh();
            }
        });
    }

    function handleDeleteLesson(lessonId: string) {
        if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
            return;
        }

        startTransition(async () => {
            const result = await deleteLesson(lessonId);
            if (result.status === "error") {
                toast.error(result.message);
            } else {
                toast.success("Lesson deleted successfully");
                router.refresh();
            }
        });
    }

    function toggleChapter(chapterId: string) {
        setItems((prevItems) => 
            prevItems.map((chapter) => 
                chapter.id === chapterId ? {...chapter, isOpen: !chapter.isOpen} : chapter
            )
        );
    }

    const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

    return (
        <DndContext 
            collisionDetection={rectIntersection} 
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <Card>
                <CardTitle className="flex flex-row items-center justify-between p-4 border-b border-border">
                    <span>Chapters</span>
                <CardContent className='space-y-8' />
                    <Button 
                        onClick={() => setIsAddingChapter(true)}
                        size="sm"
                        disabled={isPending || isAddingChapter}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Chapter
                    </Button>
                </CardTitle>
                <CardContent className="p-4">
                    {/* Add new chapter form */}
                    {isAddingChapter && (
                        <Card className="mb-4 p-4">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Chapter title..."
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateChapter();
                                        } else if (e.key === 'Escape') {
                                            setIsAddingChapter(false);
                                            setNewChapterTitle("");
                                        }
                                    }}
                                    disabled={isPending}
                                    autoFocus
                                />
                                <Button 
                                    onClick={handleCreateChapter}
                                    size="sm"
                                    disabled={isPending || !newChapterTitle.trim()}
                                >
                                    Save
                                </Button>
                                <Button 
                                    onClick={() => {
                                        setIsAddingChapter(false);
                                        setNewChapterTitle("");
                                    }}
                                    size="sm"
                                    variant="outline"
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    )}
                    <SortableContext items={allSortableItems} strategy={verticalListSortingStrategy}>
                        {items.map((item) => (
                            <SortableItem key={item.id} data={{type: 'chapter'}} id={item.id}>
                                {(listeners) => (
                                    <Card className="mb-2">
                                        <Collapsible open={item.isOpen} onOpenChange={() => toggleChapter(item.id)}>
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center justify-between p-3 border-b border-border cursor-pointer hover:bg-muted/50">
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            className="cursor-grab opacity-60 hover:opacity-100"
                                                            {...listeners}
                                                        >
                                                            <GripVertical className='size-4'/>
                                                        </button>
                                                        <div className="flex items-center gap-4">
                                                            {item.isOpen ? (
                                                                <ChevronDown className='size-4' />
                                                            ) : (
                                                                <ChevronRight className='size-4' />
                                                            )}
                                                            {editingChapter === item.id ? (
                                                                <Input
                                                                    value={editTitle}
                                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        e.stopPropagation();
                                                                        if (e.key === 'Enter') {
                                                                            handleEditChapter(item.id);
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingChapter(null);
                                                                            setEditTitle("");
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        setEditingChapter(null);
                                                                        setEditTitle("");
                                                                    }}
                                                                    disabled={isPending}
                                                                    autoFocus
                                                                    className="w-auto"
                                                                />
                                                            ) : (
                                                                <span className="font-medium">{item.title}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingChapter(item.id);
                                                                setEditTitle(item.title);
                                                            }}
                                                            disabled={isPending}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteChapter(item.id)}
                                                            disabled={isPending}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-3 space-y-2">
                                                    {item.lessons.map((lesson) => (
                                                        <SortableItem key={lesson.id} data={{type: 'lesson', chapterId: item.id}} id={lesson.id}>
                                                            {(lessonListeners) => (
                                                                <div className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors group">
                                                                    <div className="flex items-center gap-4">
                                                                        <button 
                                                                            className="cursor-grab opacity-60 hover:opacity-100"
                                                                            {...lessonListeners}
                                                                        >
                                                                            <GripVertical className='size-4'/>
                                                                        </button>
                                                                        <FileText className="size-4" />
                                                                        <Link 
                                                                            href={`/admin/courses/${courseId}/${item.id}/${lesson.id}`}
                                                                            className="text-sm hover:underline"
                                                                        >
                                                                            {lesson.title}
                                                                        </Link>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                                        disabled={isPending}
                                                                        className=" transition-opacity hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </SortableItem>
                                                    ))}
                                                    {item.lessons.length === 0 && (
                                                        <p className="text-sm text-muted-foreground">No lessons in this chapter</p>
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                                <div>
                                                    <Button className='w-full' variant="outline">
                                                        Create New Lesson
                                                    </Button>
                                                </div>
                                        </Collapsible>
                                    </Card>
                                )}
                            </SortableItem>
                        ))}
                    </SortableContext>
                </CardContent>
            </Card>
        </DndContext>
    )
}