import { cn } from "@/lib/utils";
import { CloudUploadIcon, ImageIcon, Loader2, XIcon } from "lucide-react";
import { Button } from "../ui/button";

export function RenderEmptyState({isDragActive}: {isDragActive: boolean}) {
    return (
        <div className="text-center">
            <div className="flex items-center mx-auto justify-center size-12
                rounded-full bg-muted mb-4">
                <CloudUploadIcon className={cn('size-6 text-muted-foreground',
                    isDragActive && 'text-primary' 
                )} />
            </div>
            <p className="text-base font-semibold text-foreground">
                Drop your files here or 
                <span className="text-primary font-bold cursor-pointer"> Click to upload</span></p>
                <Button type="button" className="mt-4">
                    Select Files
                </Button>
        </div>
        
    );
}


export function RenderErrorState(){
return (
    <div className="text-destructive text-center">
        <div className="flex items-center mx-auto justify-center size-12
                rounded-full bg-destructive mb-4">
                <ImageIcon className={cn('size-6 text-muted-foreground',
                )} />
        </div>
        <p className="text-base font-semibold">Upload Failed</p>
        <p className="text-xl mt-1">Some thing went wrong</p>
        <Button className="mt-4" type="button">Retry File Selection</Button>
    </div>
);
}

export function RenderUploadState({
    previewUrl, 
    isDeleting, 
    handleRemoveFile
} :{
    previewUrl: string;
    isDeleting: boolean;
    handleRemoveFile: () => void;
}) {
    return <div className="relative w-full h-full">
        <img
            src={previewUrl} 
            alt="Upload File" 
            className="w-full h-full object-contain rounded-lg" 
        />
        <Button 
        variant="destructive" 
        size="icon" 
        className={cn("absolute top-2 right-2 shadow-lg")} 
        onClick={handleRemoveFile}
        disabled={isDeleting}>
        {isDeleting ? (
            <Loader2  className="size-4 animate-spin" />
        ) : (
            <XIcon className="size-4" />
        )}
        </Button>
    </div>;
}

export function RenderUploadingState({progress,file} :{progress: number; file: File}) {
    return(
        <div className="text-center flex justify-center items-center flex-col">
            <p className="mt-2 text-sm font-medium text-foreground">Uploading...</p>

            <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">{file.name}</p>

        </div>
    )
}