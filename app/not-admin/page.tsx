import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export default function NotAdminPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="bg-destructive/10 rounded-full p-4 w-fit mx-auto">
                        <ShieldX className="size-16 text-destructive" />
                    </div>

                    <CardTitle className="text-2xl mx-auto">
                        Access Restricted
                    </CardTitle>
                    <CardDescription className="max-w-xs mx-auto">
                        Hey! you are not an admin, which means you can&apos;t create any
                        courses or stuff like that...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href={"/"} className={buttonVariants({
                        className: "w-full",
                        variant: "outline",
                    })}>
                    <ArrowLeft className="mr-1 size-4" />
                        Back to home
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
