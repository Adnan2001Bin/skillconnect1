// app/api/download/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return NextResponse.json(
      { error: 'File URL is required' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    // Extract filename from URL or use a default
    const filename = fileUrl.split('/').pop() || 'download';
    
    // Determine content type from response or use application/octet-stream
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}