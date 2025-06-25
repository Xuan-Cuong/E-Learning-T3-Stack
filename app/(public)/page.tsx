"use client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface featureProps{
    title: string;
    description: string;
    icon: string; // You can use an icon library or custom icons
}
const features: featureProps[] = [
    {
        title:"Comprehensive Courses",
        description:"Access a wide range of carefully curated course designed by industry experts.",
        icon: '📚',
    },
    {
        title:"Interactive Learning",
        description:"Engage with interactive content, quizzes, and assignments to enhance your understanding.",
        icon: '🖥️',
    },
    {
        title:"Flexible Schedule",
        description:"Learn at your own pace with flexible scheduling options that fit your lifestyle.",
        icon: '⏰',
    },
    {
        title:"Community Support",
        description:"Join a vibrant community of learners and instructors for support and collaboration.",
        icon: '🤝',
    }
]

export default function Home() {
  return (
   <>
    <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
            <Badge variant="outline">
                The Future of Online Education
            </Badge>
            <h1 className="text-4xl md:tex-6xl font-bold tracking-tight">Elevate your Learning Experience</h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">Discover a new wy to learn with out modern,interactive learning management system.
                Access high-quality course anytime, anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link className={buttonVariants({
                    size: "lg",
                })} href="/courses">
                    Explore Courses
                </Link>
                <Link className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                })} href="/login">
                    SignIn
                </Link>
            </div>
        </div>
    </section>

    <section className="grid frid-clos-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
        {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
            </Card>
        ))}
    </section>
   </>
  );
}