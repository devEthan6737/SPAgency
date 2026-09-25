/**
 * Custom ids of the buttons the paginators add. Prefixed so they can never collide with the id of a
 * button a caller adds next to them (the caller's own ids go through `Paginator.run`).
 */
export enum PaginationButtonId {
    Previous = 'pagination:previous',
    Next = 'pagination:next',
    Back = 'pagination:back',
    Information = 'pagination:information',
    Up = 'pagination:up',
    Down = 'pagination:down',
    Empty1 = 'pagination:empty1',
    Empty2 = 'pagination:empty2',
    Empty3 = 'pagination:empty3',
    Empty4 = 'pagination:empty4'
}
