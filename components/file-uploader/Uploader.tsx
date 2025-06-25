"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import {  RenderEmptyState, RenderErrorState } from "./RenderState";
import { toast } from "sonner";
import { object, set } from "zod";
import {v4 as uuidv4} from 'uuid';
import { ca } from "zod/v4/locales";

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

export function Uploader(){

    const [fileState, setFileState] = useState<UploadState>({
        error: false,
        file: null,
        id: null,
        uploading: false,
        progress: 0,
        isDeleting: false,
        fileType: "image",

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
                    isImage: file.type.startsWith('image/')
                }),
            });
            if(!presignedResponse.ok){
                toast.error('Failed to get presigned URL');
                 setFileState((prev) =>({
            ...prev,
            uploading: false,
            progress: 0,
            error: true,

        }));
            }
            const {presignedUrl, key}= await presignedResponse.json();

            await new Promise((resolve,reject) =>{
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
                            key: key,                    }));
                    toast.success('File uploaded successfully');
                    resolve(true);
                    } 
                    
                };
                
                xhr.onerror = () => {
                    reject(new Error('Upload failed'));
                };
                
                xhr.open('PUT', presignedUrl);
                xhr.send(file);
            });
        } catch (error) {
            setFileState((prev) =>({
                ...prev,
                uploading: false,
                error: true,
            }));
            toast.error('Upload failed');
        }
    }

    const onDrop = useCallback((acceptedFiles: File[])  => {

        if(acceptedFiles.length > 0 ){
            const file = acceptedFiles[0];

            setFileState((prevState) => ({
                file: file,
                uploading: false,
                progress: 0,
                objectUrl: URL.createObjectURL(file),
                error: false,
                id: uuidv4(),
                isDeleting: false,
                fileType:"image"
            }))
        }
        }, [])

    
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

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept:{"image/*": []},
        maxFiles: 1,
        multiple: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        onDropRejected: rejectedFiles,
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
         <RenderEmptyState isDragActive={isDragActive} />
    </CardContent>
      </Card>
  );
};
