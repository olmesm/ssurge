import formidable from "formidable";
import Koa from "koa";
import { type Context, type Next } from "koa";
import koaBody from "koa-body";
import fs from "node:fs";
import path from "node:path";
import unzipper from "unzipper";

interface File {
  path: string;
}

interface Files {
  file: File;
  directory: string;
}

interface Fields {
  subDirectory: string;
}

const app: Koa = new Koa();
app.use(koaBody({ multipart: true }));

// logger
app.use(async (ctx: Context, next: Next) => {
  await next();
  const rt = ctx.response.get("X-Response-Time");
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set("X-Response-Time", `${ms}ms`);
});

// response

// Route for handling POST request with zip file
app.use(async (ctx: Context, next: Next) => {
  if (ctx.path === "/deploy" && ctx.method === "POST") {
    const file = (ctx.request.files as any)["files[file]"] as formidable.File;
    const { subDirectory }: Fields = ctx.request.body.fields;

    try {
      // Create directory if not exist // __dirname
      const targetDir: string = ["", "www", "static", subDirectory].join(
        path.sep
      );
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Extract zip file
      await fs
        .createReadStream(file.filepath)
        .pipe(unzipper.Extract({ path: targetDir }))
        .promise();

      // Remove temporary file
      fs.unlinkSync(file.filepath);

      ctx.status = 200;
      ctx.body = { message: "Zip file extracted successfully" };
    } catch (err) {
      console.error(err);
      ctx.status = 500;
      ctx.body = { error: "Failed to extract zip file" };
    }
  } else {
    await next();
  }
});

app.use(async (ctx: Context) => {
  ctx.body = "Hello, Koa on Unit!";
});

app.listen(3000);
