import { file } from 'bun';
import { extname, resolve } from 'path';

// In a Vercel serverless function, the current working directory is the root of the project.
const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = resolve(PROJECT_ROOT, 'src');

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let filePath = url.pathname;

  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Use substring(1) to remove the leading slash from the path
  const fullPath = resolve(PUBLIC_DIR, filePath.substring(1));

  // Security check: ensure the resolved path is still within the public directory
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const f = file(fullPath);
    const exists = await f.exists();

    if (!exists) {
      // Log the file that was not found for easier debugging in Vercel
      console.error(`File not found: ${fullPath}`);
      return new Response('Not Found', { status: 404 });
    }

    const extension = extname(fullPath).slice(1);
    let contentType = 'text/plain;charset=utf-8';

    switch (extension) {
      case 'html':
        contentType = 'text/html;charset=-8';
        break;
      case 'css':
        contentType = 'text/css;charset=utf-8';
        break;
      case 'js':
        contentType = 'application/javascript;charset=utf-8';
        break;
      // Add other common types if needed
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    return new Response(f, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}