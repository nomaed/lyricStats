///<reference path="../../typings/tsd.d.ts"/>
/**
 * Last.fm API partial implementation
 * http://www.last.fm/api
 *
 * @module lib/lastfm-api
 */

import {Promise} from 'es6-promise';
import * as _ from 'lodash';
import {Rest, RestOptions} from './rest';

export default class LastFmApi {
    private static apiUrl = 'http://ws.audioscrobbler.com/2.0/';
    private rest:Rest;
    private apiKey:string;

    /**
     * @param {string} apiKey
     * @constructor
     */
    constructor(apiKey:string) {
        this.apiKey = apiKey;
        this.rest = new Rest(LastFmApi.apiUrl);
    }

    /**
     * Fetches list of artists with name matching <var>artistName</var>.
     * Result is an array of matching and similar artist names.
     * @param {string} artistName
     * @return {Promise}
     */
    public findArtist(artistName:string):Promise<any> {
        return new Promise((resolve, reject) => {
            this.runQuery({artist: artistName}, 'artist.search')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.results &&
                            result.results.artistmatches &&
                            result.results.artistmatches.artist || null);
                    }
                );
        });
    }

    /**
     * Fetching artist info.
     * @param {string} artistName
     * @return {Promise}
     */
    public getArtist(artistName:string):Promise<any> {
        return new Promise((resolve, reject) => {
            this.runQuery({artist: artistName}, 'artist.getInfo')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.artist || null);
                    }
                );
        });
    }

    /**
     * Fetches the <var>numResults</var> number of top albums for <var>artistName</var>
     * @param {string} artistName
     * @param {number=} numResults Default is 50 (see <a href="http://www.last.fm/api/show/artist.getTopAlbums">spec</a>)
     * @return {Promise}
     */
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
                    }
                );
        });
    }

    /**
     * Get list of tracks from an album matching MBID, or from search result by artist and album name
     * @param {string} artistName Artist name or MBID
     * @param {string=} albumName Not used if MBID is gives as <var>artistName</var>
     * @return {Promise}
     */
    public getTracks(artistName:string, albumName?:string):Promise<any> {
        var options;
        if (LastFmApi.isMBID(artistName)) {
            options = {
                mbid: artistName
            };
        } else {
            options = {
                artistName: artistName,
                albumName: albumName
            };
        }
        return new Promise((resolve, reject) => {
            this.runQuery(options, 'album.getInfo')
                .then(
                    result => {
                        if (!result || result.error) reject(LastFmApi.errorMessage(result));
                        else resolve(result && result.album && result.album.tracks &&
                            result.album.tracks.track || null);
                    }
                );
        });
    }

    /**
     * Fetches artist's top tracks
     * @param {string} artist Artist name or MBID
     * @param {number} numResults Default is 50 (see <a href="http://www.last.fm/api/show/artist.getTopTracks">spec</a>)
     * @return {Promise}
     */
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
                    }
                );
        });

    }

    /**
     * Returns only the exact match from <em>findArtist</em> results list
     * @param {string} artistName
     * @return {Promise}
     */
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
                    }
                );
        });
    }

    /**
     * Runs a REST/HTTP-GET query and returns a promise with the JSON parsed result
     * @param {RestOptions} options
     * @param {string} method
     * @return {Promise}
     * @private
     */
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

    /**
     * Formats a Last.fm API error response
     * @param {LastFmRestError} result
     * @returns {string}
     * @private
     */
    private static errorMessage(result:LastFmRestError):string {
        if (!result || !result.error || !result.message) return 'Unknown error';
        return `Error #${result.error}: ${result.message}`;
    }

    /**
     * Checks if a string is a valid MBID
     * @see https://musicbrainz.org/doc/MusicBrainz_Identifier
     * @param {string} mbid
     * @returns {boolean}
     * @static
     */
    public static isMBID(mbid:string):boolean {
        return /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(mbid);
    }
}

interface LastFmRestError {
    error: number,
    message: string
}
