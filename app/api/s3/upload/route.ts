import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import {v4 as uuidv4} from 'uuid';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';
import arcjet, { detectBot, fixedWindow } from "@arcjet/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/app/data/admin/require-admin";

// Simple S3 client without env validation for testing
const S3 = new S3Client({
    region: 'auto',
    endpoint: 'https://t3.storage.dev',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
});

export const fileUploadSchema = z.object({
    fileName: z.string().min(1, {message: "File name is required"}),
    contentType: z.string().min(1, {message: "Content type is required"}),
    size: z.number().min(1, {message: "File size is required"}),
    isImage: z.boolean(),
});

const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        detectBot({
            mode: 'LIVE',
            allow: [],
        }),
        fixedWindow({
            mode: 'LIVE',
            window: "1m",
            max: 5,
        })
    ]
});

export async function POST(request: Request){
    
    const session = await requireAdmin();
    try{

        const decision = await aj.protect(request);

        if(decision.isDenied()){
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        console.log('API Route called');
        console.log('Environment check:', {
            bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            region: process.env.AWS_REGION,
            endpoint: process.env.AWS_ENDPOINT_URL_S3
        });
        
        const body = await request.json();
        console.log('Request body:', body);
        
        const validation = fileUploadSchema.safeParse(body);

        if(!validation.success){
            console.log('Validation error:', validation.error);
            return NextResponse.json(
                { error : "Invalid Request Body", details: validation.error.issues},
                {status: 400}
            );
        }

        const { fileName, contentType, size } = validation.data;

        const uniqueKey = `${uuidv4()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            ContentType: contentType,
            ContentLength: size,
            Key: uniqueKey
        });

        const presignerUrl = await getSignedUrl(S3, command,{
            expiresIn: 360, // URL expires in 6 minutes
        });
        
        const response = {
            presignedUrl: presignerUrl,
            key: uniqueKey,
        };

        console.log('Success:', response);
        return NextResponse.json(response);
    }catch(error){
        console.error('S3 Upload Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}