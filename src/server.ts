import type {BRsp} from "./types";

const port = 9898;
const baseUrl = `http://localhost:${port}`;

const server = Bun.serve({
    port,
    async fetch(req) {
        const path = req.url.replace(baseUrl, "");
        const headers: ResponseInit = {
            headers: {
                "Content-Type": "application/json",
                ETag: (12_345).toFixed(),
                Origin: "Bun-Sandbox",
            },
            status: 200,
            statusText: "Ok",
        };
        const response: BRsp = {api: "Bun-Sandbox/v0.0.1"};

        switch (path) {
            case "/": break;
            case "/hello":
                response.data = {
                    message: "What's up my dude ?!",
                    token: Math.random().toString(32),
                };
                break;
            case "/txtFile": {
                const file = Bun.file("./data/stream.txt");
                const type = file.type;
                const content = await Bun.readableStreamToText(
                    file.stream(),
                );
                response.data = {file: {type, content}};
                break;
            }
            default:
                headers.status = 400;
                headers.statusText = "Nope";
                response.error = {
                    code: 67_001,
                    message: "Unsupported route.",
                };
                break;
        }

        return Response.json(response, headers);
    },
  });
  
process.stdout.write(
    `📟 Listening on http://localhost:${server.port} ...`
);
