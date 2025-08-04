const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    if (path === "/") path = "/index.html";

    const filePath = "./src" + path;

    return new Response(Bun.file(filePath));
  },
  error(error) {
    return new Response(null, { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}...`);