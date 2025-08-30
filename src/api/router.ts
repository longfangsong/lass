export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export interface RouteParams {
  [key: string]: string;
}

export interface RouterContext {
  request: Request;
  env: Env;
  params: RouteParams;
  query: URLSearchParams;
  ctx: ExecutionContext;
  url: URL;
}

export type RouteHandler = (ctx: RouterContext) => Promise<Response> | Response;

export type Middleware = (
  ctx: RouterContext,
  next: () => Promise<Response> | Response,
) => Promise<Response> | Response;

export interface PrefixMiddleware {
  prefix: string;
  middleware: Middleware;
  pattern: RegExp;
}

export interface PrefixOptions {
  exact?: boolean; // If true, matches exact path only, not children
}

export interface RouteOptions {
  middleware?: Middleware[];
}

export interface RouteDefinition {
  method: HTTPMethod;
  path: string;
  handler: RouteHandler;
  middleware: Middleware[];
  pattern: RegExp;
  keys: string[];
}

export interface PrefixMiddleware {
  prefix: string;
  middleware: Middleware;
  pattern: RegExp;
}

/**
 * Converts a path pattern to a regular expression
 * Supports parameters like /users/:id and wildcards
 */
export function pathToRegexp(path: string): {
  pattern: RegExp;
  keys: string[];
} {
  const keys: string[] = [];

  // Escape special regex characters except for our parameter syntax
  let pattern = path
    .replace(/[.+*?^${}()|[\]\\]/g, "\\$&")
    .replace(/\/:\w+/g, (match) => {
      const key = match.slice(2); // Remove the \:
      keys.push(key);
      return "/([^/]+)"; // Match any characters except /
    })
    .replace(/\\\*/g, "(.*)"); // Handle wildcards

  // Ensure exact match
  pattern = "^" + pattern + "$";

  return {
    pattern: new RegExp(pattern),
    keys,
  };
}

/**
 * Converts a prefix pattern to a regular expression
 * Supports exact matching or prefix matching
 */
export function prefixToRegexp(prefix: string, exact: boolean = false): RegExp {
  // Escape special regex characters
  let pattern = prefix.replace(/[.+*?^${}()|[\]\\]/g, "\\$&");

  if (exact) {
    // Exact match only
    pattern = "^" + pattern + "$";
  } else {
    // Prefix match - the path must start with this prefix
    pattern = "^" + pattern;
    // If prefix doesn't end with /, add optional / and anything after
    if (!prefix.endsWith("/")) {
      pattern += "(?:/.*)?";
    } else {
      pattern += ".*";
    }
  }

  return new RegExp(pattern);
}

/**
 * Extracts parameters from a matched URL
 */
export function extractParams(
  keys: string[],
  matches: RegExpMatchArray,
): RouteParams {
  const params: RouteParams = {};

  for (let i = 0; i < keys.length; i++) {
    params[keys[i]] = matches[i + 1] || "";
  }

  return params;
}

/**
 * Extracts query parameters from URL
 */
export function extractQuery(url: URL): URLSearchParams {
  return url.searchParams;
}

export class Route {
  public readonly method: HTTPMethod;
  public readonly path: string;
  public readonly handler: RouteHandler;
  public readonly middleware: Middleware[];
  public readonly pattern: RegExp;
  public readonly keys: string[];

  constructor(
    method: HTTPMethod,
    path: string,
    handler: RouteHandler,
    middleware: Middleware[] = [],
  ) {
    this.method = method;
    this.path = path;
    this.handler = handler;
    this.middleware = middleware;

    const { pattern, keys } = pathToRegexp(path);
    this.pattern = pattern;
    this.keys = keys;
  }

  /**
   * Check if this route matches the given method and pathname
   */
  matches(method: string, pathname: string): RegExpMatchArray | null {
    if (this.method !== method.toUpperCase()) {
      return null;
    }

    return pathname.match(this.pattern);
  }
}

export class Router {
  private routes: Route[] = [];
  private globalMiddleware: Middleware[] = [];
  private prefixMiddleware: PrefixMiddleware[] = [];
  private notFoundHandler: RouteHandler = () =>
    new Response("Not Found", { status: 404 });
  private errorHandler: (error: Error, ctx: RouterContext) => Response = (
    error,
  ) => {
    console.log(error);
    const message = import.meta.env.DEV
      ? `Internal Server Error, ${error.message}`
      : "Internal Server Error";
    return new Response(message, { status: 500 });
  };

  /**
   * Add global middleware that applies to all routes
   */
  use(middleware: Middleware): this {
    this.globalMiddleware.push(middleware);
    return this;
  }

  /**
   * Add middleware for specific path prefixes
   */
  usePrefix(
    prefix: string,
    middleware: Middleware,
    options: PrefixOptions = {},
  ): this {
    const { exact = false } = options;
    const pattern = prefixToRegexp(prefix, exact);

    this.prefixMiddleware.push({
      prefix,
      middleware,
      pattern,
    });

    return this;
  }

  /**
   * Add middleware for multiple prefixes at once
   */
  usePrefixes(
    prefixes: string[],
    middleware: Middleware,
    options: PrefixOptions = {},
  ): this {
    prefixes.forEach((prefix) => {
      this.usePrefix(prefix, middleware, options);
    });
    return this;
  }

  /**
   * Set custom 404 handler
   */
  notFound(handler: RouteHandler): this {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Set custom error handler
   */
  onError(handler: (error: Error, ctx: RouterContext) => Response): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Register a route
   */
  private addRoute(
    method: HTTPMethod,
    path: string,
    handler: RouteHandler,
    options: RouteOptions = {},
  ): this {
    const middleware = options.middleware || [];
    const route = new Route(method, path, handler, middleware);
    this.routes.push(route);
    return this;
  }

  // HTTP method helpers
  get(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("GET", path, handler, options);
  }

  post(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("POST", path, handler, options);
  }

  put(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("PUT", path, handler, options);
  }

  delete(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("DELETE", path, handler, options);
  }

  patch(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("PATCH", path, handler, options);
  }

  head(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("HEAD", path, handler, options);
  }

  options(path: string, handler: RouteHandler, options?: RouteOptions): this {
    return this.addRoute("OPTIONS", path, handler, options);
  }

  /**
   * Get matching prefix middleware for a given path
   */
  private getMatchingPrefixMiddleware(pathname: string): Middleware[] {
    return this.prefixMiddleware
      .filter((pm) => pm.pattern.test(pathname))
      .map((pm) => pm.middleware);
  }

  /**
   * Handle incoming requests
   */
  async handle(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase() as HTTPMethod;
    const pathname = url.pathname;

    // Find matching route
    const matchedRoute = this.routes.find((route) =>
      route.matches(method, pathname),
    );

    // Get matching prefix middleware
    const matchingPrefixMiddleware = this.getMatchingPrefixMiddleware(pathname);

    if (!matchedRoute) {
      const context: RouterContext = {
        request,
        params: {},
        query: extractQuery(url),
        env,
        ctx,
        url,
      };

      try {
        // Apply global middleware and matching prefix middleware to 404 handler
        const allMiddleware = [
          ...this.globalMiddleware,
          ...matchingPrefixMiddleware,
        ];

        return await this.executeMiddleware(allMiddleware, context, () =>
          this.notFoundHandler(context),
        );
      } catch (error) {
        return this.errorHandler(error as Error, context);
      }
    }

    // Extract route parameters
    const matches = matchedRoute.matches(method, pathname);
    const params = matches ? extractParams(matchedRoute.keys, matches) : {};

    const context: RouterContext = {
      request,
      params,
      query: extractQuery(url),
      env,
      ctx,
      url,
    };

    try {
      // Combine all middleware: global -> prefix -> route-specific
      const allMiddleware = [
        ...this.globalMiddleware,
        ...matchingPrefixMiddleware,
        ...matchedRoute.middleware,
      ];

      return await this.executeMiddleware(allMiddleware, context, () =>
        matchedRoute.handler(context),
      );
    } catch (error) {
      return this.errorHandler(error as Error, context);
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddleware(
    middleware: Middleware[],
    context: RouterContext,
    finalHandler: () => Promise<Response> | Response,
  ): Promise<Response> {
    if (middleware.length === 0) {
      return await finalHandler();
    }

    let index = 0;

    const next = async (): Promise<Response> => {
      if (index >= middleware.length) {
        return await finalHandler();
      }

      const currentMiddleware = middleware[index++];
      return await currentMiddleware(context, next);
    };

    return await next();
  }

  /**
   * Create a subrouter for a specific prefix
   * This is a convenience method for grouping routes under a prefix
   */
  prefix(pathPrefix: string, callback: (router: Router) => void): this {
    const subrouter = new Router();
    callback(subrouter);

    // Add all subrouter routes to this router with the prefix
    subrouter.routes.forEach((route) => {
      const prefixedPath =
        pathPrefix +
        (route.path.startsWith("/") ? route.path : "/" + route.path);
      this.addRoute(route.method, prefixedPath, route.handler, {
        middleware: route.middleware,
      });
    });

    return this;
  }
}
