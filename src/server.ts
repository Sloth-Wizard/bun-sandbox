import type {BRsp} from "./types";
import type {BunFile} from "bun";

import process from "process";
import {dlopen, FFIType, suffix} from "bun:ffi";

const port = 9898;
const baseUrl = `http://localhost:${port}`;

// Example from < https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read >
async function* lineIterator(file: BunFile): AsyncGenerator<string, void, unknown> {
    // Setup a decoder to read the buffers data to utf8 string
    const decoder = new TextDecoder();
    function decodeChunk(chunk?: Uint8Array): string {
        return chunk ? decoder.decode(chunk) : "";
    }

    // Linebreak regex
    const regex = /\r\n|\n|\r/gmi;
    // Get the file ReadableStream
    const stream = file.stream();
    // Retreive the reader
    const reader = stream.getReader();
    // Setup our chunk from the reader::{value: chunk, done: readerDone}
    let readable = await reader.read();
    let chunk = decodeChunk(readable.value);
    
    let i = 0;
    for (;;) {
        if (readable.done) {
            break;
        }

        let result = regex.exec(chunk);
        if (!result) {
            const remainder = chunk.slice(i);
            
            readable = await reader.read();
            chunk += remainder + decodeChunk(readable.value);

            i = regex.lastIndex = 0;
            continue;
        }

        yield chunk.substring(i, result.index);
        i = regex.lastIndex;
    }

    if (i < chunk.length) {
        yield chunk.slice(i);
    }
}

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
                const file = Bun.file("./data/txt.txt");
                const size = file.size;
                const type = file.type;
                const content = await Bun.readableStreamToText(
                    file.stream(),
                );
                response.data = {file: {size, type, content}};
                break;
            }
            case "/stream": {
                // Get the file
                const file = Bun.file("./data/stream");
                const size = file.size;
                const type = file.type;

                let completeStream = "";
                let i = 0;
                process.stdout.write("\n--- STREAM START\n");
                for await (const line of lineIterator(file)) {
                    process.stdout.write(`CHUNK: [${i}];\nLINE: [${line}]\n`);

                    completeStream += line;

                    i++
                }
                process.stdout.write("--- STREAM END\n");

                response.data = {file: {
                    size,
                    type,
                    content: completeStream,
                }};
                break;
            }
            case "/rs": {
                const path = `libadd.${suffix}`;

                const lib = dlopen(path, {
                    gen_jwt: {
                        returns: [FFIType.void, FFIType.char],
                    },
                });

                lib.symbols.gen_jwt();

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
