# Posting schedule

Ben's cadence (25 Nov 2026), once the account is up to date:

- **Day D:** the brief comes out (08:00 stories) and the morning concepts go to Ben; he picks.
- **Day D + 1:** the picked posters go out on the grid as ONE post (Ben, 27 Nov): a carousel with his favourite as the
  cover, then his other picks, each poster followed by its own close-ups (all four quarters for two posters, the top pair
  each when there are more, within Instagram's ten slides), in the 13:00 slot (the later slots are back-ups). On moving days the favourite's moving poster replaces its still on the grid, and Ben posts it by hand
  (with music), ideally in the 13:00 slot.
- **Day D + 2:** the favourite's making-of reel, posted by hand by Ben (with music), around 17:00. One reel a day.

A reel never goes out before its poster. Every morning run checks this file and the auto-poster's state
(`instagram/state.json`), and the concepts message tells Ben exactly what he has to post by hand that day (and
flags anything overdue). When Ben says he's posted something, mark it here.

**Nudges** (Ben, 25 Nov 2026): at the time of each by-hand post, nudge him with a push notification and resurface the
file to post (SendUserFile of the mp4, plus its caption in a code block). The morning run schedules these with
`send_later` into its own session for that day's by-hand items, at the planned times above.

## By hand (Ben)

| Item | Brief | Due (D+1 poster / D+2 reel) | Plan | Posted |
| --- | --- | --- | --- | --- |
| 050 The Summer Bottled Early, making-of reel | 21 Nov | 23 Nov | | posted (over 1,000 views) |
| 051 The Long Road's Quiet Pause, making-of reel | 22 Nov | 24 Nov (overdue) | Wed 25 Nov, 12:00 | posted (Ben, 26 Nov) |
| 052 Morris by Day Himself by Night, making-of reel | 23 Nov | 25 Nov (its poster goes out 13:00 today) | Wed 25 Nov, 17:00 | posted (Ben, 26 Nov) |
| 054 Back From Functional Extinction, moving poster (9:16) | 25 Nov | 26 Nov | Thu 26 Nov, 13:00 | posted (Ben, 26 Nov) |
| 053 Catch Mercury Before Sunrise, making-of reel | 24 Nov | 26 Nov | Thu 26 Nov, 17:00 | posted (Ben, 26 Nov) |
| 054 Back From Functional Extinction, making-of reel | 25 Nov | 27 Nov | Fri 27 Nov, 17:00 | posted (Ben, 28 Nov) |
| 055 Caught Between Road and Rope, making-of reel (Ben, 28 Nov: this one instead of The Ball Never Landed; first trial opening on the finished poster, REVEAL=1) | 26 Nov | 28 Nov | Sat 28 Nov, 17:00 | |
| 056 Where No Road Reaches (illustrated), making-of reel | 27 Nov | 29 Nov | Sun 29 Nov, 17:00 | |

## Automatic (auto-poster), as queued on 25 Nov

- Wed 25 Nov: 052 Every Wall Became a Garden 10:30, 052 Morris by Day Himself by Night 13:00, 052 A Workman's House
  of Wonder 16:00, 053 Catch Mercury Before Sunrise 19:00, 053 The Smallest Planet Steps Out 21:30.
- Thu 26 Nov: 053 Chasing Light Near the Sun (first slot, a day late). From Fri 27 Nov the grid is on the normal
  rhythm: No. 055's picks (brief 26 Nov) go out on 27 Nov: 1A The Ball Never Landed, 3C Caught Between Road and Rope (stills, automatic).
- From 27 Nov, one grid post a day: 055's picks (1A, 3C) together at 13:00 on 27 Nov; 056's on Sat 28 Nov: 6B illustrated Where No Road Reaches as the cover, then 7A, 2B and 3A.
