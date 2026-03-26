// src/lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET!

/**
 * Upload a file buffer to R2.
 * Key format: {filingId}/{checklistItemId}/{filename}
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }))
  return key
}

/**
 * Generate a signed URL valid for 1 hour for CA to view/download a file.
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn: 3600 })
}

/**
 * Download a file from a URL (Twilio media URL) and return as Buffer.
 * Twilio requires basic auth to fetch media.
 */
export async function fetchTwilioMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const credentials = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID!}:${process.env.TWILIO_AUTH_TOKEN!}`
  ).toString("base64")

  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  })

  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`)

  const contentType = res.headers.get("content-type") ?? "application/octet-stream"
  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), contentType }
}