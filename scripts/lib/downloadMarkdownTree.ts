import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

type PropfindItem = {
  href: string;
  isCollection: boolean;
};

/**
 *
 */
function isDebugEnabled(): boolean {
  return process.env.WEBDAV_DEBUG === "1" || process.env.WEBDAV_DEBUG === "true";
}

/**
 *
 * @param value
 */
function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 *
 * @param rootDir
 * @param relativePath
 */
function safeJoin(rootDir: string, relativePath: string): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(rootDir, relativePath);
  if (resolvedTarget === resolvedRoot) return resolvedTarget;
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Refusing to write outside destinationDir: ${relativePath}`);
  }
  return resolvedTarget;
}

/**
 *
 * @param error
 */
function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  return String(error);
}

/**
 *
 * @param error
 */
function isBodyUnusableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Body is unusable/i.test(error.message);
}

/**
 *
 * @param ms
 */
async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 *
 * @param options
 * @param options.url
 * @param options.username
 * @param options.appPassword
 * @param options.method
 * @param options.headers
 * @param options.body
 */
async function webdavRequest(options: {
  url: URL;
  username: string;
  appPassword: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<Response> {
  const { url, username, appPassword, method, headers, body } = options;

  const auth = Buffer.from(`${username}:${appPassword}`, "utf8").toString("base64");
  return fetch(url, {
    method,
    headers: { Authorization: `Basic ${auth}`, ...(headers ?? {}) },
    body,
  });
}

/**
 *
 * @param options
 * @param options.url
 * @param options.username
 * @param options.appPassword
 * @param options.method
 * @param options.headers
 * @param options.body
 * @param options.maxAttempts
 */
async function webdavRequestText(options: {
  url: URL;
  username: string;
  appPassword: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  maxAttempts?: number;
}): Promise<{ response: Response; text: string }> {
  const { maxAttempts = 3, ...requestOptions } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await webdavRequest({
      ...requestOptions,
      headers:
        attempt > 1
          ? { ...(requestOptions.headers ?? {}), Connection: "close" }
          : requestOptions.headers,
    });

    try {
      const text = await response.text();
      return { response, text };
    } catch (error: unknown) {
      lastError = error;
      if (!isBodyUnusableError(error) || attempt >= maxAttempts) {
        throw new Error(
          `Failed to read response body for ${requestOptions.method} ${
            requestOptions.url
          } (status ${response.status}): ${formatUnknownError(error)}`
        );
      }

      if (isDebugEnabled()) {
        process.stdout.write(
          `Retrying ${requestOptions.method} ${requestOptions.url} after body read error (attempt ${attempt}/${maxAttempts})\n`
        );
      }
      await delay(150 * attempt);
      continue;
    }
  }

  throw new Error(
    `Failed to read response body for ${requestOptions.method} ${
      requestOptions.url
    }: ${formatUnknownError(lastError)}`
  );
}

/**
 *
 * @param options
 * @param options.baseUrl
 * @param options.currentUrl
 * @param options.href
 */
function resolveHrefToSameOriginUrl(options: { baseUrl: URL; currentUrl: URL; href: string }): URL {
  const { baseUrl, currentUrl, href } = options;
  const resolved = new URL(href, currentUrl);
  return new URL(`${resolved.pathname}${resolved.search}${resolved.hash}`, baseUrl.origin);
}

/**
 *
 * @param url
 */
function ensureTrailingSlash(url: URL): URL {
  if (url.pathname.endsWith("/")) return url;
  const copy = new URL(url);
  copy.pathname += "/";
  return copy;
}

/**
 *
 * @param propstat
 */
function selectOkPropstat(propstat: unknown): Record<string, unknown> | undefined {
  const propstats = toArray(
    propstat as Record<string, unknown> | Record<string, unknown>[] | undefined
  );
  if (propstats.length === 0) return undefined;

  for (const item of propstats) {
    const status = String((item as { status?: unknown }).status ?? "");
    if (/\s200\s/.test(status)) return item;
  }
  return propstats[0];
}

/**
 *
 * @param options
 * @param options.url
 * @param options.username
 * @param options.appPassword
 * @param options.depth
 */
async function propfind(options: {
  url: URL;
  username: string;
  appPassword: string;
  depth: "0" | "1";
}): Promise<PropfindItem[]> {
  const { url, username, appPassword, depth } = options;

  const { response, text: xmlText } = await webdavRequestText({
    url,
    username,
    appPassword,
    method: "PROPFIND",
    headers: {
      Depth: depth,
      "Content-Type": "application/xml; charset=utf-8",
    },
    body:
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<d:propfind xmlns:d="DAV:">' +
      "<d:prop><d:resourcetype/></d:prop>" +
      "</d:propfind>",
  });

  if (!response.ok) {
    throw new Error(`PROPFIND failed (${response.status}) for ${url}: ${xmlText}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  const data = parser.parse(xmlText) as Record<string, unknown>;
  const multistatus =
    (data.multistatus as Record<string, unknown> | undefined) ??
    (data["d:multistatus"] as Record<string, unknown> | undefined) ??
    (data["D:multistatus"] as Record<string, unknown> | undefined);
  const responses = toArray(
    (multistatus as { response?: unknown } | undefined)?.response as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined
  );

  const items = responses
    .map((item) => {
      const href = String((item as { href?: unknown }).href ?? "");
      const propstat = selectOkPropstat((item as { propstat?: unknown }).propstat);
      const prop = (propstat?.prop ?? {}) as Record<string, unknown>;
      const resourcetype = prop.resourcetype;
      const isCollection =
        !!resourcetype && typeof resourcetype === "object" && "collection" in resourcetype;
      return { href, isCollection };
    })
    .filter((item) => item.href.length > 0);

  if (isDebugEnabled()) {
    process.stdout.write(`PROPFIND ${url} depth=${depth} -> ${items.length} items\n`);
  }

  return items;
}

/**
 *
 * @param options
 * @param options.url
 * @param options.username
 * @param options.appPassword
 * @param options.destinationPath
 */
async function downloadFile(options: {
  url: URL;
  username: string;
  appPassword: string;
  destinationPath: string;
}): Promise<void> {
  const { url, username, appPassword, destinationPath } = options;

  const { response, text: content } = await webdavRequestText({
    url,
    username,
    appPassword,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`GET failed (${response.status}): ${content}`);
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, content, "utf8");
}

/**
 *
 * @param options
 * @param options.baseUrl
 * @param options.href
 */
function toRelativePath(options: { baseUrl: URL; href: string }): string | null {
  const { baseUrl, href } = options;
  const fullUrl = new URL(href, baseUrl);
  const basePath = baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`;
  if (!fullUrl.pathname.startsWith(basePath)) return null;
  const encodedRelativePath = fullUrl.pathname.slice(basePath.length);
  return decodeURIComponent(encodedRelativePath);
}

/**
 *
 * @param options
 * @param options.baseUrl
 * @param options.currentUrl
 * @param options.username
 * @param options.appPassword
 * @param options.destinationDir
 */
async function walkAndDownload(options: {
  baseUrl: URL;
  currentUrl: URL;
  username: string;
  appPassword: string;
  destinationDir: string;
}): Promise<void> {
  const { baseUrl, currentUrl, username, appPassword, destinationDir } = options;
  const items = await propfind({
    url: currentUrl,
    username,
    appPassword,
    depth: "1",
  });

  const markdownItems = items.filter((item) => item.href.endsWith(".md"));

  for (const item of markdownItems) {
    const itemUrl = resolveHrefToSameOriginUrl({
      baseUrl,
      currentUrl,
      href: item.href,
    });
    const relativePath = toRelativePath({ baseUrl, href: itemUrl.href });
    if (relativePath === null || relativePath.length === 0) {
      continue;
    }

    if (item.isCollection) {
      await walkAndDownload({
        baseUrl,
        currentUrl: ensureTrailingSlash(itemUrl),
        username,
        appPassword,
        destinationDir,
      });
      continue;
    }

    if (!relativePath.toLowerCase().endsWith(".md")) {
      continue;
    }

    const destinationPath = safeJoin(destinationDir, relativePath);
    await downloadFile({
      url: itemUrl,
      username,
      appPassword,
      destinationPath,
    });
  }
}

/**
 *
 * @param options
 * @param options.rootUrl
 * @param options.username
 * @param options.appPassword
 * @param options.destinationDir
 */
export async function downloadMarkdownTree(options: {
  rootUrl: URL;
  username: string;
  appPassword: string;
  destinationDir: string;
}): Promise<void> {
  const { rootUrl, username, appPassword, destinationDir } = options;
  await walkAndDownload({
    baseUrl: rootUrl,
    currentUrl: rootUrl,
    username,
    appPassword,
    destinationDir,
  });
}
