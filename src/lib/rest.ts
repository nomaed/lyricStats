///<reference path="../../typings/tsd.d.ts"/>
import * as http from 'http';
import {Promise} from 'es6-promise';

export interface RestOptions {
    [name:string]: string|number;
}

export class Rest {
    private baseUrl:string;

    constructor(baseUrl:string) {
        this.baseUrl = baseUrl;
    }

    private buildUrl(opts?:RestOptions) {
        var urlParams = '',
            urlBase = this.baseUrl;
        if (opts) {
            urlParams += (urlBase.indexOf('?') === -1 ? '?' : '&');
            var params:string[] = [];
            for (var opt in opts) {
                if (!opts.hasOwnProperty(opt)) continue;
                var val:string = ''+opts[opt],
                    match = new RegExp(`:${opt}\\b`);
                if (match.test(urlBase)) {
                    urlBase = urlBase.replace(match, val);
                }
                else {
                    params.push(`${opt}=${encodeURIComponent(val)}`);
                }
            }
            urlParams += params.join('&');
        }
        return urlBase + urlParams;
    }

    public get(opts:RestOptions):Promise<string> {
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
}