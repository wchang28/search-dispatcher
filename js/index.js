"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events = require("events");
var shortid_1 = require("shortid");
var _ = require("lodash");
var defaultOptions = {
    maxItemsReturned: -1,
    maxWaitTimeMS: 500
};
// this class emits the following events
// 1.  dispatch-query (QueryId: string, Query: string, SearchContext: any)
var SearchDispatcher = (function (_super) {
    __extends(SearchDispatcher, _super);
    function SearchDispatcher(options) {
        var _this = _super.call(this) || this;
        _this.__options = (options || defaultOptions);
        _this.__options = _.assignWith({}, defaultOptions, _this.__options);
        _this.__cache = {};
        return _this;
    }
    Object.defineProperty(SearchDispatcher.prototype, "Options", {
        get: function () { return this.__options; },
        enumerable: true,
        configurable: true
    });
    SearchDispatcher.prototype.search = function (Query, SearchContext) {
        var _this = this;
        var QueryId = shortid_1.generate();
        this.__cache[QueryId] = { results: [] };
        this.emit("dispatch-query", QueryId, Query, SearchContext);
        return new Promise(function (resolve, reject) {
            _this.__cache[QueryId].resolve = resolve;
            _this.__cache[QueryId].timer = setTimeout(function () {
                var results = _this.__cache[QueryId].results;
                delete _this.__cache[QueryId];
                resolve(results);
            }, _this.Options.maxWaitTimeMS);
        });
    };
    SearchDispatcher.prototype.checkInSearchResult = function (QueryId, Results) {
        if (this.__cache[QueryId]) {
            this.__cache[QueryId].results = this.__cache[QueryId].results.concat(Results);
            if (this.Options.maxItemsReturned > 0 && this.__cache[QueryId].results.length >= this.Options.maxItemsReturned) {
                this.__cache[QueryId].results = this.__cache[QueryId].results.slice(0, this.Options.maxItemsReturned);
                clearTimeout(this.__cache[QueryId].timer);
                var results = this.__cache[QueryId].results;
                var resolve = this.__cache[QueryId].resolve;
                delete this.__cache[QueryId];
                resolve(results);
            }
        }
    };
    return SearchDispatcher;
}(events.EventEmitter));
exports.SearchDispatcher = SearchDispatcher;
