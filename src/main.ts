///<reference path="../typings/tsd.d.ts"/>
import {Promise} from 'es6-promise';
import LastFmApi from './lib/lastfm-api';
import chartLyrics from './lib/chartlyrics-api'

// start Main as soon as current code stack is done
setImmediate(()=>Main.main('Manowar'));

/**
 * There's no real reason to use a "main" class here. It is not required by TS
 * nor it is needed for JS in general. But I just wanted to go with it for no
 * specific reason.
 * @class Main (static)
 */
class Main {
    constructor() {
        throw new Error('main is static and cannot be instantiated');
    }

    /**
     * Application entry point
     * @param {string} artistName
     */
    static main(artistName:string):void {
        // Go to http://www.last.fm/api to generate your own key
        var apiKey = '11fa3732789f78bf2fef8f3fd106f1ad';
        var lastFm = new LastFmApi(apiKey);

        var topTracks = 50;
        var artist:string = artistName;

        console.log(`Getting ${topTracks} top track for: ${artist}`);
        lastFm.getTopTracks(artist, topTracks)
            .then(result => result.map(track => track.name))
            //.then(tracks => this.fetchLyrics(tracks))
            .then(tracks => Main.queueLyricsFetch(artist, tracks))
            .then(result => Main.prepareStatistics(artist, result.join(' ')))
            .catch(reason => {
                console.error(reason.stack || reason.toString());
            });
    }

    /**
     * Queues ChartLyrics queries for SearchLyric and GetLyric. Each query will
     * be throttled to be sent evey 0.5 second, otherwise ChartLyrics server
     * drops connections.
     * @see module:lib/chartlyrics-api
     * @param artist
     * @param tracks
     * @return {Promise}
     */
    static queueLyricsFetch(artist:string, tracks:Array<string>):Promise<any> {
        var allLyrics = [],
            artistName = artist,
            originalLength = tracks.length,
            i = 1;
        console.log(tracks);
        console.log('\nFetching lyrics...');
        return new Promise((resolve, reject) => {
            function fetchNext() {
                if (tracks.length > 0) {
                    var trackName = tracks.shift();
                    console.log(`[${i++}/${originalLength}] ${trackName}`);
                    chartLyrics.searchLyric(artistName, trackName, true)
                        .then(
                            result => {
                                var res = result[0];
                                if (!res.LyricId || !res.LyricChecksum) {
                                    setTimeout(fetchNext, 500);
                                    return;
                                }
                                setTimeout(() => {
                                    chartLyrics.getLyric(res.LyricId, res.LyricChecksum)
                                        .then(
                                            lyric => {
                                                allLyrics.push(lyric.Lyric);
                                                setTimeout(fetchNext, 500);
                                            },
                                            reason => reject(reason)
                                        );
                                }, 500);
                            },
                            reason => reject(reason)
                        );
                }
                else {
                    console.log(allLyrics);
                    resolve(allLyrics);
                }
            }

            fetchNext();
        });
    }

    /**
     * Run basic statistics analysis and prints it out
     * @param {string} artist
     * @param {string|string[]} arg
     */
    static prepareStatistics(artist:string, arg:string|Array<string>):void {
        var text = typeof arg === 'string' ? arg : (Array.isArray(arg) ? arg.join(' ') : (arg.toString() || ''));
        var words = text.toLowerCase().replace(/[^a-z ]/g, '').split(' ');

        var counter:WordCounter = {};
        words.map(word => Main.countWord(word, counter));

        var unique = Object.keys(counter); // == _.uniq(words);
        var sortable = [];
        for (var i = 0; i < unique.length; i++) {
            var elem = [
                counter[unique[i]],
                unique[i]
            ];
            console.log(elem);
            sortable.push(elem);
        }
        sortable.sort((a, b) => b[0] - a[0]);

        console.log(`\nAnalyzing ${artist} lyrics...`);
        console.log(`\tFound ${words.length} words`);
        console.log(`\tFound ${unique.length} unique words:`);
        sortable.forEach(word => console.log(`\t\t${word[0]}: ${word[1]}`));
    }

    /**
     * Increments the <var>counter</var> value for <var>word</var>
     * @param {string} word
     * @param {WordCounter} counter
     * @returns {string}
     */
    static countWord(word:string, counter:WordCounter):string {
        if (typeof counter[word] === 'undefined') counter[word] = 0;
        counter[word]++;
        return word;
    }

}

interface WordCounter {
    [name:string]: number;
}

