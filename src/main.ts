///<reference path="../typings/tsd.d.ts"/>
import * as _ from 'lodash';
import LastFmApi from './lib/lastfm-api';
import chartLyrics from './lib/chartlyrics-api'
import {Promise} from 'es6-promise';

interface WordCounter {
    [name:string]: number;
}
class Main {
    static topTracks = 50;
    static apiKey = '11fa3732789f78bf2fef8f3fd106f1ad';

    private lastFm:LastFmApi;
    private artist:string;

    constructor(artist:string) {
        this.lastFm = new LastFmApi(Main.apiKey);
        this.artist = artist;
    }

    analyze() {
        console.log(`Getting ${Main.topTracks} top track for: ${this.artist}`);
        this.lastFm.getTopTracks(this.artist, Main.topTracks)
            .then(result => result.map(track => track.name))
            //.then(tracks => this.fetchLyrics(tracks))
            .then(tracks => this.queueLyricsFetch(tracks))
            .then(result => this.prepareStatistics(result.join(' ')))
            .catch(reason => {
                console.error(reason.stack || reason.toString());
            });
    }

    queueLyricsFetch(tracks:Array<string>):Promise<any> {
        //tracks = tracks.slice(28, 32);
        var allLyrics = [],
            artistName = this.artist,
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

    prepareStatistics(text:string):void;
    prepareStatistics(texts:Array<string>):void;
    prepareStatistics(arg:any):void {
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

        console.log(`\nAnalyzing ${this.artist} lyrics...`);
        console.log(`\tFound ${words.length} words`);
        console.log(`\tFound ${unique.length} unique words:`);
        sortable.forEach(word => console.log(`\t\t${word[0]}: ${word[1]}`));
    }

    static countWord(word:string, counter:WordCounter):string {
        if (typeof counter[word] === 'undefined') counter[word] = 0;
        counter[word]++;
        return word;
    }

}

new Main('Manowar').analyze();
