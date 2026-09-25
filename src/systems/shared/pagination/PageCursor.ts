/** What a page shows about itself, 1-based like a reader would count. */
export interface PageView {
    /** The page being shown, starting at 1. */
    page: number;
    totalPages: number;
    totalItems: number;
}

/**
 * The arithmetic of paging through a list: which page is current, whether there is a next or a
 * previous one, and which slice of the list belongs to it. Holds no data and knows nothing about
 * Discord, so {@link Paginator} and {@link PaginationSelector} share it.
 */
export class PageCursor {
    private page = 0;

    /**
     * @param totalItems How many items there are to page through.
     * @param pageSize How many items go on each page.
     */
    constructor(
        private totalItems: number,
        readonly pageSize: number
    ) {}

    /** The current page, starting at 0. */
    get currentPage(): number {
        return this.page;
    }

    /** The number of pages; never less than one, so an empty list still has a page to say so on. */
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    }

    /** The index in the whole list of the first item of the current page. */
    get firstIndex(): number {
        return this.page * this.pageSize;
    }

    get hasPrevious(): boolean {
        return this.page > 0;
    }

    get hasNext(): boolean {
        return this.page + 1 < this.totalPages;
    }

    /** The current page described for the user. */
    get view(): PageView {
        return { page: this.page + 1, totalPages: this.totalPages, totalItems: this.totalItems };
    }

    /** @returns Whether it moved: `false` when already on the last page. */
    next(): boolean {
        if (!this.hasNext) return false;
        this.page++;

        return true;
    }

    /** @returns Whether it moved: `false` when already on the first page. */
    previous(): boolean {
        if (!this.hasPrevious) return false;
        this.page--;

        return true;
    }

    /**
     * @param page The page to show, starting at 0; clamped into the valid range.
     */
    goTo(page: number): void {
        this.page = Math.min(Math.max(0, page), this.totalPages - 1);
    }

    /**
     * @param index An index in the whole list.
     * @returns The page (starting at 0) that index lives on.
     */
    pageOf(index: number): number {
        return Math.floor(index / this.pageSize);
    }

    /**
     * @param items The whole list.
     * @returns The items that belong on the current page.
     */
    slice<T>(items: readonly T[]): T[] {
        return items.slice(this.firstIndex, this.firstIndex + this.pageSize);
    }

    /**
     * Tells the cursor the list changed length, keeping the current page valid.
     * @param totalItems The new length of the list.
     */
    resize(totalItems: number): void {
        this.totalItems = totalItems;
        this.goTo(this.page);
    }
}
