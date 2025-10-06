export type Modules = 'event' | 'request' | 'state';

class Logger {
    private modules: Set<Modules> = new Set();

    public on(mod: Modules) {
        this.modules.add(mod);
    }

    public off(mod: Modules) {
        this.modules.delete(mod);
    }

    public event(...args: unknown[]) {
        if (this.modules.has('event')) {
            console.log(`[event] [${new Date().toISOString()}] `, ...args);
        }
    }

    public request(...args: unknown[]) {
        if (this.modules.has('request')) {
            console.log(`[request] [${new Date().toISOString()}]`, ...args); 
        }
    }

    public state(...args: unknown[]) {
        if (this.modules.has('state')) {
            console.log(`[state] [${new Date().toISOString()}]`, ...args); 
        }
    }
}

export const logger = new Logger();

if (import.meta.env.VITE_LOG_EVENT) {
    logger.on('event');
}

if (import.meta.env.VITE_LOG_REQUEST) {
    logger.on('request');
}

if (import.meta.env.VITE_LOG_STATE) {
    logger.on('state');
}
