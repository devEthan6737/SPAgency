import type { ExtraProps } from 'seyfert';
import { BotEnvironment } from '../shared/Environment.js';

/**
 * Decides which commands exist in which environment. Two marks in a command's `props` shrink it:
 * `devOnly` keeps it out of production, and `canaryOnly` keeps it out of everything but the canary bot.
 */
export class CommandAvailability {
    /**
     * @param props The command's `props`.
     * @param environment The environment this process runs as.
     * @returns Whether the command is registered and can run here.
     */
    static isAvailable(props: ExtraProps | undefined, environment: BotEnvironment): boolean {
        if (props?.devOnly && environment === BotEnvironment.Production) return false;
        if (props?.canaryOnly && environment !== BotEnvironment.Canary) return false;

        return true;
    }
}
