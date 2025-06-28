"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import {  RenderEmptyState, RenderErrorState, RenderUploadingState, RenderUploadState } from "./RenderState";
import { toast } from "sonner";
import { object, set } from "zod";
import {v4 as uuidv4} from 'uuid';
import { ca, tr } from "zod/v4/locales";
import { useConstructUrl } from "@/hooks/use-construct";

interface UploadState {
    id : string | null;
    file: File | null;
    uploading: boolean;
    progress: number;
    key?: string;
    isDeleting: boolean;
    error: boolean;
    objectUrl?: string;
    fileType : "image" | "video";
}

interface iAppProps{
    value?: string;
    onChange?: (value: string) => void;
}

export function Uploader({onChange, value}: iAppProps) {
    const fileUrl = useConstructUrl(value || '');
    const [fileState, setFileState] = useState<UploadState>({
        error: false,
        file: null,
        id: null,
        uploading: false,
        progress: 0,
        isDeleting: false,
        fileType: "image",
        key: value,
        objectUrl: fileUrl
    });

    
   
    async function uploadFile(file: File) {
        setFileState((prev) =>({
            ...prev,
            uploading: true,
            progress: 0,

        }));

        try {
            //1.Get presigned URL 

            const presignedResponse = await fetch('/api/s3/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                    size: file.size,
                    isImage: true, // Assuming we are uploading an image
                }),
                
            });
            if(!presignedResponse.ok){
                const errorData = await presignedResponse.json().catch(() => ({}));
                console.error('Presigned URL Error:', errorData);
                toast.error(`Failed to get presigned URL: ${errorData.error || 'Unknown error'}`);
                 setFileState((prev) =>({
                    ...prev,
                    uploading: false,
                    progress: 0,
                    error: true,

                }));
                return;
            }
            const {presignedUrl, key}= await presignedResponse.json();

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();                xhr.upload.onprogress = (event) => {
                    if(event.lengthComputable){
                        const percentageComplete = (event.loaded / event.total) * 100;
                        setFileState((prev) =>({
                            ...prev,
                            uploading: true,
                            progress: Math.round(percentageComplete),
                        }));
                    }
                };
                
                xhr.onload = () => {
                    if(xhr.status === 200 || xhr.status === 204){
                      setFileState((prev) =>({
                            ...prev,
                            uploading: false,
                            progress: 100,
                            key: key,                    
                        }));

                        onChange?.(key);
                    toast.success('File uploaded successfully');
                    resolve();
                    } else {
                        reject(new Error('Upload failed...'));
                    }
                }; 
                    xhr.onerror = () => {
                        reject(new Error('Upload failed'));
                    };
                    xhr.open('PUT', presignedUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);

            });
        } catch  {
            toast.error('Something went wrong');
            setFileState((prev) =>({
                            ...prev,
                            uploading: false,
                            progress: 100,
                            error: true,
                        }));
        }
    }

    const onDrop = useCallback((acceptedFiles: File[])  => {

        if(acceptedFiles.length > 0 ){
            const file = acceptedFiles[0];

            if(fileState.objectUrl && fileState.objectUrl.startsWith("http")){
                URL.revokeObjectURL(fileState.objectUrl);
            }

            setFileState((prevState) => ({
                file: file,
                uploading: false,
                progress: 0,
                objectUrl: URL.createObjectURL(file),
                error: false,
                id: uuidv4(),
                isDeleting: false,
                fileType:"image"
            }));

            uploadFile(file);
        }
        }, [fileState.objectUrl]
    );

    async function handleRemoveFile() {
        try {
            const response = await fetch('/api/s3/delete', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    key: fileState.key,
                }),
            });
            if(!response.ok){
                toast.error('Failed to remove file from storage');
                setFileState((prev) =>({
                                ...prev,
                                isDeleting: true,
                                error: false,
                                
                            }));

                return;
            }
            if(fileState.objectUrl && fileState.objectUrl.startsWith("http")){
                URL.revokeObjectURL(fileState.objectUrl);
            }

            onChange?.('');
            setFileState(() =>({
                file: null,
                uploading: false,
                progress: 0,
                objectUrl: undefined,
                error: false,
                fileType: "image",
                id: null,
                isDeleting: false,
            }));
            toast.success('File removed successfully');
        } catch{
        toast.error('Failed removing file. Please try again');
        setFileState((prev) =>({
            ...prev,
            isDeleting: true,
            error: false,
        }));
    }
}
    function rejectedFiles(fileRejection: FileRejection[]){
        if(fileRejection.length){
           const tooManyFiles = fileRejection.find((rejection) => rejection.errors
           [0].code === 'too-many-files');

           const fileSizeToBig = fileRejection.find((rejection) => rejection.errors[0].code === 'file-too-large');

           if(fileSizeToBig){
            toast.error('File Size exceeds the limit')
           }

           if(tooManyFiles){
            toast.error('Too many files selected, max is 1')
           }
        }
    }

    function renderContent(){
        if(fileState.uploading){
            return <RenderUploadingState file={fileState.file as File} progress={0} />;
        }
        if(fileState.error){
            return <RenderErrorState />
        }

        if(fileState.objectUrl){
            return (
                <RenderUploadState 
                    handleRemoveFile={handleRemoveFile}
                    previewUrl={fileState.objectUrl} 
                    isDeleting={fileState.isDeleting}
                />
            );  
        }

        return <RenderEmptyState isDragActive={isDragActive} />;
    }

    useEffect(() => {
        return () => {
            if(fileState.objectUrl && fileState.objectUrl.startsWith("http")){
                URL.revokeObjectURL(fileState.objectUrl);
            }
        };
    }, [fileState.objectUrl]);
    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept:{"image/*": []},
        maxFiles: 1,
        multiple: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        onDropRejected: rejectedFiles,
        disabled: fileState.uploading || !!fileState.isDeleting,
     })
    return(
    <Card {...getRootProps()} className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64 ",
        isDragActive 
        ? "border-primary bg-primary/10 border-solid" 
        : "border-border hover:border-primary"
    )}>
     <CardContent className="flex items-center justify-center h-full w-full">
         <input {...getInputProps()} />
         {renderContent()}
    </CardContent>
      </Card>
  );
}
