import * as events from "events";
import {generate} from "shortid";
import * as _ from "lodash";

export interface Options {
    maxItemsReturned?: number;
    maxWaitTimeMS?: number;
}

let defaultOptions: Options = {
    maxItemsReturned: -1
    ,maxWaitTimeMS: 500
};

interface CacheItem<DATUM> {
    results: DATUM[];
    timer?: NodeJS.Timer;
    resolve?: (value: DATUM[]) => void;
}

// this class emits the following events
// 1.  dispatch-query (QueryId: string, Query: string, SearchContext: any)
export class SearchDispatcher<DATUM> extends events.EventEmitter {
    private __options: Options
    private __cache: {[QueryId: string]: CacheItem<DATUM>}; // map from query id to CacheItem
    constructor(options?: Options) {
        super();
        this.__options = (options || defaultOptions);
        this.__options = _.assignWith({}, defaultOptions, this.__options);
        this.__cache = {}; 
    }
    get Options() : Options {return this.__options;}

    search(Query:string, SearchContext?: any) : Promise<DATUM[]> {
        let QueryId = generate();
        this.__cache[QueryId] = {results:[]};
        this.emit("dispatch-query", QueryId, Query, SearchContext);
        return new Promise<DATUM[]>((resolve: (value: DATUM[]) => void, reject: (err: any) => void) => {
            this.__cache[QueryId].resolve = resolve;
            this.__cache[QueryId].timer = setTimeout(() => {
                let results = this.__cache[QueryId].results;
                delete this.__cache[QueryId];
                resolve(results);
            }, this.Options.maxWaitTimeMS);
        });
    }

    checkInSearchResult(QueryId: string, Results: DATUM[]) {
        if (this.__cache[QueryId]) {
            this.__cache[QueryId].results = this.__cache[QueryId].results.concat(Results);
            if (this.Options.maxItemsReturned > 0 && this.__cache[QueryId].results.length >= this.Options.maxItemsReturned) {
                this.__cache[QueryId].results = this.__cache[QueryId].results.slice(0, this.Options.maxItemsReturned);
                clearTimeout(this.__cache[QueryId].timer);
                let results = this.__cache[QueryId].results;
                let resolve = this.__cache[QueryId].resolve;
                delete this.__cache[QueryId];
                resolve(results);
            }
        }
    }
}