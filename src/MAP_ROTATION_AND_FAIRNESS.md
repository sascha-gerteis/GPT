# Map Rotation & Fairness

## Current rotating pools

| Game | Layouts | Selection behavior |
|---|---:|---|
| Obstacle Sprint | 8 | Random from pool, excludes immediate previous course |
| Falling Tiles | 4 | Random floor layout, excludes immediate previous layout |
| Safe Zone | 4 | Random platform arrangement, excludes immediate previous layout |
| Wall Dodge | 4 | Random wall-pattern arena, excludes immediate previous layout |
| Maze Rush | 12 | Random deterministic maze seed, excludes immediate previous maze |
| Meteor Dodge | 4 | Random circular arena theme/strike-sequence variant, excludes immediate previous variant |

All competitors in one match receive the same selected layout.

## Production recommendation

The server—not the browser—should select and commit the map before gameplay starts. Store the map ID, map-pool version, game build, selection seed/commitment, and map definition hash with the match audit record.

## Games intentionally kept as signature arenas

Floor Breaker, Knockout, Bomb Tag, Red Light Run and Coin Rush currently keep one recognizable core arena. New maps should only be added when they materially change gameplay while preserving equal conditions, not simply to create cosmetic variety.
