/// <reference types="node" />
import * as events from "events";
export interface Options {
    maxItemsReturned?: number;
    maxWaitTimeMS?: number;
}
export declare class SearchDispatcher<DATUM> extends events.EventEmitter {
    private __options;
    private __cache;
    constructor(options?: Options);
    readonly Options: Options;
    search(Query: string, SearchContext?: any): Promise<DATUM[]>;
    checkInSearchResult(QueryId: string, Results: DATUM[]): void;
}
