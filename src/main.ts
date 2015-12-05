///<reference path="../typings/tsd.d.ts"/>
import * as _ from 'lodash';
import LastFmApi from './lib/lastfm-api';
import chartLyrics from './lib/chartlyrics-api'
import {Promise} from 'es6-promise';

interface WordCounter {
    [name:string]: number;
}
class Main {
    static trackCountThreshold = 5;
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

    prepareStatistics(text:string);
    prepareStatistics(texts:Array<string>);

    prepareStatistics() {
        var text = typeof arguments[0] === 'string' ? arguments[0] : Array.prototype.join.call(arguments, ' ');
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

//var sample = ['Manowar, Manowar Living On The Road When We\'re In Town Speakers Explode We Don\'t Attract Whimps \'Cause We\'re Too Loud Just True Metal People That\'s Manowar\'s Crowd They Wanna Keep Us Down But They Can\'t Last When We Get Up We\'re Gonna Kick Your Ass Gonna Keep On Burning We Always Will Other Bands Play - Manowar Kill Other Bands Play - Manowar Kill We Like It Hard, We Like It Fast We Got The Biggest Amps, Man They Blast The True Metal People Wanna Rock Not Pose Wearin\' Jeans And Leather, Not Cracker Jack Clothes They Wanna Keep Us Down But They Can\'t Last When We Get Up We\'re Gonna Kick Your Ass Gonna Keep On Burning We Always Will Other Bands Play - Manowar Kill Other Bands Play - Manowar Kill We\'re The Kings Of Metal Comin\' To Town When We Light Up, Have The Roof Nailed Down Don\'t Try To Tell Us That We\'re Too Loud \'Cause There Ain\'t No Way That We\'ll Ever Turn Down They Wanna Keep Us Down But They Can\'t Last When We Get Up We\'re Gonna Kick Your Ass Gonna Keep On Burning We Always Will Other Bands Play - Manowar Kill Other Bands Play - Manowar Kill',
//    'Here our soldiers stand From all around the world Waiting in a line To hear the battle cry All are gathered here Victory is near The sound will fill the hall Bringing power to us all We alone are fighting for metal That is true We own the right to live the fight We\'re here for all of you Now swear the blood upon your steel Will never dry Stand and fight together Beneath the battle sky Chorus: Brothers everywhere Raise your hands into the air We\'re warriors, Warriors of the world! Like thunder from the sky Sworn to fight and die We\'re warriors, Warriors of the world! Many stand against us But they will never win We said we would return And here we are again To bring them all Destruction, Suffering and pain We are the hammer of the gods We are thunder, wind and rain There they wait in fear With swords in feeble hand With dreams to be a king First one should be a man I call them out and Charged them all with A life that is a lie And in their final hour They shall confess before they die Chorus: repeat slow If I should fall in battle My brothers who fight by my side Gather my horse and weapons Tell my family how I died Till then I will be strong I will fight for all that is real All who stand in my way will die... By steel... Chorus 2: Brothers... repeat 4x',
//    'Brothers I Am Calling From The Valley Of The Kings With Nothing to Atone A Dark March Lies Ahead Together We Will Ride Like Thunder From The Sky May Your Sword Stay Wet Like A Young Girl In Her Pride Hold Your Hammers High Blood And Death Are Waiting Like A Raven In The Sky I Was Born To Die Hear Me While I Live Now As I Look Into Your Eyes None Shall Hear A Lie Now Power And Dominion Are Taken By The Will By Divine Right Hail And Kill Hail Hail Hail And Kill Hail And Kill Hail Hail Hail And Kill Hail And Kill And My Father Was A Wolf I\'m The Kinsman Of The Slain Sworn To Rise Again I Will Bring Salvation, Punishment And Pain The Hammer Of Hate Is Our Fame Power And Dominion Are Taken By The Will By Divine Right Hail And Kill Hail Hail Hail And Kill Hail And Kill Hail Hail Hail And Kill Hail And Kill Rip Their Flesh Burn Their Hearts Stab Them In The Eyes Rape Their Women As They Cry Kill Their Servants Burn Their Homes Till There\'s No Blood Left To Spill Hail And Kill Power And Dominion Are Taken By The Will By Divine Right Hail And Kill Hail Hail Hail And Kill Hail And Kill'];
//
//new Main('Manowar').prepareStatistics(sample);
