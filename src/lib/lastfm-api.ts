///<reference path="../../typings/tsd.d.ts"/>
import * as _ from 'lodash';
import {Rest, RestOptions} from './rest';
import {Promise} from 'es6-promise';

interface lastFmRestError {
    error: number,
    message: string
}

export default class LastFmApi {
    private static apiUrl = 'http://ws.audioscrobbler.com/2.0/';
    private rest:Rest;
    private apiKey:string;

    constructor(apiKey:string) {
        this.apiKey = apiKey;
        this.rest = new Rest(LastFmApi.apiUrl);
    }

    public findArtist(artistName:string):Promise<any> {
        return new Promise((resolve, reject) => {
            this.runQuery({artist: artistName}, 'artist.search')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.results &&
                            result.results.artistmatches &&
                            result.results.artistmatches.artist || null);
                    },
                    reason => reject(reason)
                );
        });
    }

    public getArtist(artistName:string):Promise<any> {
        return new Promise((resolve, reject) => {
            this.runQuery({artist: artistName}, 'artist.getInfo')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.artist || null);
                    },
                    reason => reject(reason)
                );
        });
    }

    public getTopAlbums(artistName:string, numResults?:number):Promise<any> {
        var options:RestOptions = {artist: artistName};
        if (numResults) options['limit'] = numResults;
        return new Promise((resolve, reject) => {
            this.runQuery(options, 'artist.getTopAlbums')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.topalbums &&
                            result.topalbums.album || null);
                    },
                    reason => reject(reason)
                );
        });
    }

    public getTracks(mbid:string):Promise<any>;
    public getTracks(artistName:string, albumName:string):Promise<any>;

    public getTracks(artistName:string, albumName?:string):Promise<any> {
        var options;
        if (arguments.length === 2) {
            options = {
                artistName: artistName,
                albumName: albumName
            };
        }
        else {
            options = {
                mbid: artistName
            };
        }
        return new Promise((resolve, reject) => {
            this.runQuery(options, 'album.getInfo')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.album && result.album.tracks &&
                            result.album.tracks.track || null);
                    },
                    reason => reject(reason)
                );
        });
    }

    public getTopTracks(artist:string, numResults?:number):Promise<any> {
        var options:RestOptions = {};
        if (LastFmApi.isMBID(artist)) options['mbid'] = artist;
        else options['artist'] = artist;
        if (numResults) options['limit'] = numResults;
        return new Promise((resolve, reject) => {
            this.runQuery(options, 'artist.getTopTracks')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.toptracks && result.toptracks.track || null);
                    },
                    reason => reject(reason)
                );
        });

    }

    /***************************************************************************/

    public findArtistExact(artistName:string):Promise<any> {
        return new Promise((resolve, reject) => {
            this.findArtist(artistName)
                .then(
                    result => {
                        if (result && result.length) {
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].name.toLowerCase() === artistName.toLowerCase()) {
                                    resolve(result[i]);
                                    return;
                                }
                            }
                        }
                        reject(new Error('Artist not found'));
                    },
                    reason => reject(reason)
                );
        });
    }

    private runQuery(options:RestOptions, method:string):Promise<any> {
        var cmd:RestOptions = {
            method: method,
            format: 'json',
            api_key: this.apiKey
        };
        if (options) _.extend(cmd, options);
        return new Promise((resolve, reject) => {
            this.rest
                .get(cmd)
                .then(
                    result => resolve(JSON.parse(result)),
                    reason => reject(reason)
                );

        });
    }

    private static errorMessage(result:lastFmRestError):string {
        if (!result || !result.error || !result.message) return 'Unknown error';
        return `Error #${result.error}: ${result.message}`;
    }

    public static isMBID(mbid:string):boolean {
        return /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(mbid);
    }
}