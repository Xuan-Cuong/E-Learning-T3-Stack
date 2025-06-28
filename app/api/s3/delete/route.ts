import { requireAdmin } from "@/app/data/admin/require-admin";
import { auth } from "@/lib/auth";
import arcjet, { detectBot, fixedWindow } from "@arcjet/next";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
            max: 2,
        })
    ]
});

// Simple S3 client similar to upload route
const S3 = new S3Client({
    region: 'auto',
    endpoint: 'https://t3.storage.dev',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
});

export async function DELETE(request: Request) {
    try {
        const session = await requireAdmin();
        const decision = await aj.protect(request);
        
        if(decision.isDenied()){
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        
        const body = await request.json();

        const { key } = body;

        if (!key) {
            return NextResponse.json(
                { error: "Missing or invalid object key" },
                { status: 400 }
            );
        }

        
        const command = new DeleteObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: key,
        });

        await S3.send(command);

        return NextResponse.json(
            { message: "File deleted successfully" },
            { status: 200 }
        )
    }catch(error){
        console.error('S3 Delete Error:', error);
        return NextResponse.json(
            { error: "Failed to delete file", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}