///<reference path="../../typings/tsd.d.ts"/>
/**
 * Simple REST/HTTP-get helper
 * @module lib/rest
 */

import * as http from 'http';
import {Promise} from 'es6-promise';

export class Rest {
    private baseUrl:string;

    constructor(baseUrl:string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Sends a HTTP GET request and returns the response body
     * @param {RestOptions=} opts Query string pairs and placeholder replacements for <var><em>this</em>.baseUrl</var>
     * @return {Promise<string>}
     */
    public get(opts?:RestOptions):Promise<string> {
        var url = this.buildUrl(opts);
        return new Promise<string>((resolve, reject) => {
            //console.log(`HTTP GET ${url}`);
            http.get(url, res => {
                var data:string = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', err => {
                reject(new Error(err.toString()));
            });
        });
    }

    /**
     * Uses <var>opts</var> keys to replace placeholders in <var><em>this</em>.baseUrl</var>,
     * and uses remaining <var>opts</var> to append as a query string.
     * @param {RestOptions=} opts
     * @returns {string} URL
     * @private
     */
    private buildUrl(opts?:RestOptions) {
        if (!opts) return this.baseUrl;
        var urlBase = this.baseUrl,
            queryParams:string[] = [];
        for (var opt in opts) {
            if (!opts.hasOwnProperty(opt)) continue;
            var val:string = '' + opts[opt],
                match = new RegExp(`:${opt}\\b`);
            if (match.test(urlBase)) {
                urlBase = urlBase.replace(match, val);
            }
            else {
                queryParams.push(`${opt}=${encodeURIComponent(val)}`);
            }
        }
        return urlBase + (urlBase.indexOf('?') === -1 ? '?' : '&') + queryParams.join('&');
    }

}

export interface RestOptions {
    [name:string]: string|number;
}