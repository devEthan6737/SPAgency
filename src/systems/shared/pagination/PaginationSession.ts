import type { ActionRow, Button, Container, Embed, MessageFlags, TextDisplay, WebhookMessage } from 'seyfert';

/**
 * A message a paginator can send or edit. In embed mode it has an embed and the rows of buttons under
 * it; in Components V2 mode it has a container followed by the buttons, and the flag that says so.
 */
export interface PaginationBody {
    embeds?: Embed[];
    components: (ActionRow<Button> | Container | TextDisplay)[];
    flags?: MessageFlags;
}

/** The message a paginator lives on and the collector listening to its buttons. Every level of a nested paginator shares one. */
export interface PaginationSession {
    message: WebhookMessage;
    collector: ReturnType<WebhookMessage['createComponentCollector']>;
}

/** How long a paginator keeps answering its buttons before it disables them. */
export const DefaultPaginationTimeoutMs = 180_000;
