# 🎵 Array Music Player

A browser-based music player whose playlist is stored in a JavaScript **array**. Built with plain HTML, CSS and JavaScript (no frameworks or build step).

## What is an array?

An **array** is a data structure that stores a collection of elements in an ordered sequence under a single name. Each element has a numbered position called an **index**, starting at 0. In most languages the elements are stored next to each other in memory, so any element can be reached directly by its index.

```js
const songs = ["Song A", "Song B", "Song C"];
songs[0];             // "Song A"
songs.length;         // 3
songs.push("Song D"); // add to the end
```

## Why are arrays necessary?

- **Many values, one name:** one `playlist` array replaces `song1, song2, song3…`.
- **Fast access:** reading `playlist[i]` takes constant time, O(1), however large the array is.
- **Order is preserved:** the sequence of items stays exactly as stored.
- **Easy bulk processing:** loops and methods such as `map`, `filter`, `sort` and `reduce` work on every element.
- **Memory efficient:** contiguous storage makes access fast and cache-friendly.
- **Building block:** stacks, queues, heaps and hash tables are often built on arrays.

## Real-world applications of arrays

| Application | How arrays are used |
|---|---|
| Music and video playlists | Songs stored in order, with next, previous and shuffle (this app) |
| Shopping carts | A list of items to add, remove and total |
| Student grade systems | Scores stored together to find average, highest and lowest |
| Image galleries | Pictures held in sequence and browsed by index |
| Game leaderboards | Scores stored and sorted to rank players |
| To-do and task managers | Tasks kept in an ordered list that can be filtered or completed |
| Weather and sensor data | Readings recorded over time for trends and charts |
| Digital images and screens | A 2D array of pixels in rows and columns |

## Why an array in this project?

A playlist is an ordered collection where position matters. Arrays give:

- **Indexed access** – `playlist[currentIndex]` finds the playing song instantly (O(1)).
- **Order preservation** – songs play in the sequence they are stored.
- **Easy iteration** – loops and array methods render, search and total the list.

## Array operations used

| Feature | Array technique |
|---|---|
| Add song | `push()` |
| Remove song | `splice()` |
| Move up / down | Swap with destructuring `[a[i], a[j]] = [a[j], a[i]]` |
| Shuffle | Fisher-Yates algorithm |
| Sort A–Z | `sort()` with `localeCompare` |
| Search | `map()` + `filter()` |
| Total length | `reduce()` |
| Next / Previous | Index arithmetic with modulo `%` (wrap-around) |
| Find song after reorder | `indexOf()` |

## Features

- Play, pause, next, previous, repeat
- Progress bar and volume control
- Add songs by URL or from a local audio file
- Reorder, remove, shuffle and sort the playlist
- Search by title or artist
- Live view of the underlying array
- Playlist saved in `localStorage` (web URLs only)

## Run locally

Open `index.html` in a browser, or run:

```bash
npx serve .
```

## Deploy

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repository.
3. Leave the framework as **Other**, with no build command, and click **Deploy**.

## Demo audio

Sample tracks are from [SoundHelix](https://www.soundhelix.com/), which offers free example songs.
