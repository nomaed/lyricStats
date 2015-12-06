# lyricStats
Generate basic statistics on artist's lyrics

This is just a small leuisure time project I wrote to experience TypeScript.
It takes an artist name and queries Last.fm and ChartLyrics public APIs to fetch 50 most popular tracks' lyrics, 
and then perfoms basic statistical analysis on the words.

Currently it simply counts the number of appearances of all uniqe words.
This will probably be changed in the future.
Also, as of right now, the artist name is in the code, and not accepted as an argument from CLI.
