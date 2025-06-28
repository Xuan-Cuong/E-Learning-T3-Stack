import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditCourseForm } from "./_components/EditCourseForm";
import { CourseStructure } from "./_components/CourseStructure";


type Params = Promise<{ courseid: string }>;

export default  async function EditRoute({ params }: { params: Params }){
    const { courseid } = await params;
    const data = await adminGetCourse(courseid);
    return (
        <div className="">
            <h1 className="text-3xl font-bold mb-8">
                Edit Course: 
                <span className="text-primary underline">{data?.title}</span>
            </h1>

            <Tabs defaultValue="basic-info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic-info">
                        Basic Info    
                    </TabsTrigger>
                    <TabsTrigger value="course-structure">
                        Course Structure
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic-info">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Info</CardTitle>
                            <CardDescription>Provide basic information about the course</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EditCourseForm data={data} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="course-structure">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Structure</CardTitle>
                            <CardDescription>Here you can update your Course Structure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CourseStructure data={data} courseId={courseid} />
                        </CardContent>
                    </Card>
                </TabsContent>
            
            </Tabs>
        </div>
    )
}

