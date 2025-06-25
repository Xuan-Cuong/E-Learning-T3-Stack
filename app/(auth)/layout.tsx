import { buttonVariants } from "@/components/ui/button";
import { Arrow } from "@radix-ui/react-tooltip";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/Logo.png";


export default function AuthLayout({ children} : {children: React.ReactNode}) {
    return( <div className="relative flex min-h-svh flex-col items-center justify-center">
        <Link href="/" className={buttonVariants({
            variant: 'outline',
            className: 'absolute top-4 left-4'
        })}>
            <ArrowLeft className="size-4" />
            Back
        </Link>

    <div className="flex w-full max-w-sm flex-col gap-">
        <Link className="flex items-center gap-1 self-center font-medium"
         href="/"> 
        <Image src={Logo} alt="Logo" width={50} height={40} />
        SatoriWave AI.
        </Link>
        {children}
        <div className="text-balance text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our <span>Terms of service</span>
            {""}
            and <span>Privacyu Policy</span>
        </div>

        </div>
    </div>
    );
}
