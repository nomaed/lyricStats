///<reference path="../../typings/tsd.d.ts"/>
/**
 * ChartLyrics public API implementation
 * http://www.chartlyrics.com/api.aspx
 *
 * @module lib/chartlyrics-api
 */

import {Promise} from 'es6-promise';
import {parseString as xml2js} from 'xml2js';
import * as _ from 'lodash';
import {Rest, RestOptions} from './rest';

class ChartLyricsApi {
    private static apiUrl = 'http://api.chartlyrics.com/apiv1.asmx/:method';
    private rest:Rest;

    constructor() {
        this.rest = new Rest(ChartLyricsApi.apiUrl)
    }

    /**
     * Search for lyrics and return the lyricId and lyricChecksum for the GetLyric function
     * @param {string} artistName
     * @param {string} trackName
     * @param {boolean=} onlyExactMatch
     * @returns {Promise<SearchLyricResult[]>}
     */
    public searchLyric(artistName:string, trackName:string, onlyExactMatch:boolean = false):Promise<SearchLyricResult[]> {
        artistName = _.trim(artistName);
        trackName = _.trim(trackName);
        return this.runQuery('SearchLyric', {
            artist: artistName,
            song: trackName
        }).then(
            result => {
                var res = result && result.ArrayOfSearchLyricResult && result.ArrayOfSearchLyricResult.SearchLyricResult || [];
                if (!onlyExactMatch || !res) return res;
                else return res.filter(song => ChartLyricsApi.matchArtistTrack(song, artistName, trackName));
            }
        );
    }

    /**
     * Search for lyrics by artist and track and directly returns the lyric or lyric add parameters.
     * @param {string} artistName
     * @param {string} trackName
     * @returns {Promise<GetLyricResult>}
     */
    public searchLyricDirect(artistName:string, trackName:string):Promise<GetLyricResult> {
        artistName = _.trim(artistName);
        trackName = _.trim(trackName);
        return this.runQuery('SearchLyricDirect', {
            artist: artistName,
            song: trackName
        }).then(result => result && result.GetLyricResult || null);
    }

    /**
     * Search for text in lyric and returns the lyricId and lyricChecksum for the GetLyric function
     * @param {string} lyricText
     * @returns {Promise<SearchLyricResult[]>}
     */
    public searchLyricText(lyricText:string):Promise<SearchLyricResult[]> {
        return this.runQuery('SearchLyricText', {
            lyricText: lyricText
        }).then(
            result => result && result.ArrayOfSearchLyricResult
            && result.ArrayOfSearchLyricResult.SearchLyricResult || []
        );
    }

    /**
     * Return lyric with lyric text, correction URL, Lyric rankigs and an URL to the album cover if applicable.
     * @param {number} lyricId
     * @param {string} lyricCheckSum
     * @returns {Promise<GetLyricResult>}
     */
    public getLyric(lyricId:number, lyricCheckSum:string):Promise<GetLyricResult> {
        return this.runQuery('GetLyric', {
            lyricId: lyricId,
            lyricCheckSum: lyricCheckSum
        }).then(result => result && result.GetLyricResult || null);
    }

    /**
     * Add lyric with lyric text and email.
     * @param {number} trackId
     * @param {string} trackCheckSum
     * @param {string} lyric
     * @param {string} email
     * @returns {Promise<string>}
     */
    public addLyric(trackId:number, trackCheckSum:string, lyric:string, email:string):Promise<string> {
        return this.runQuery('AddLyric', {
            trackId: trackId,
            trackCheckSum: trackCheckSum,
            lyric: lyric,
            email: email
        }).then(result => result && result.string && result.string._ || null);
    }

    /**
     * Runs a ChartLytics HTTP API query for {{method}}, using {{options}} as query string
     * @param {string} method
     * @param {RestOptions} options
     * @returns {Promise}
     */
    private runQuery(method:string, options:RestOptions):Promise<any> {
        options['method'] = method;
        return new Promise((resolve, reject) => {
            this.rest
                .get(options)
                .then(
                    resultXml => {
                        if (/^\w*</.test(resultXml)) {
                            return xml2js(
                                resultXml, {
                                    explicitArray: false,
                                    trim: true,
                                    normalize: true
                                }, (err, result) => {
                                    if (err) {
                                        reject(new Error(err.toString()));
                                        console.error(resultXml);
                                    }
                                    else resolve(result);
                                }
                            )
                        }
                        else {
                            reject(new Error(resultXml));
                        }
                    },
                    reason => reject(reason)
                );
        });
    }

    /**
     * Checks if an artist+track are an exact match with a specific <em>SearchLyricResult</em>
     * @param {SearchLyricResult} song
     * @param {string} artistName
     * @param {string} trackName
     * @returns {boolean}
     * @private
     */
    private static matchArtistTrack(song:SearchLyricResult, artistName:string, trackName:string):boolean {
        return song && song.Artist && song.Song
            && song.Artist.toLowerCase() === artistName.toLowerCase()
            && song.Song.toLowerCase() === trackName.toLowerCase();
    }

}

interface SearchLyricResult {
    TrackChecksum: string
    TrackId: number
    LyricChecksum: string
    LyricId: number
    SongUrl: string
    ArtistUrl: string
    Artist: string
    Song: string
    SongRank: number
}

interface GetLyricResult {
    TrackChecksum: string
    TrackId: number
    LyricChecksum: string
    LyricId: number
    LyricSong: string
    LyricArtist: string
    LyricUrl: string
    LyricCovertArtUrl: string
    LyricRank: number
    LyricCorrectUrl: string
    Lyric: string
}

export default new ChartLyricsApi();
