# Networks of communicating machine agents

Eric Gladstone · research talk · November 2026.

An animated talk on systems in which language-model agents pass messages to one another. An animated stage sits on the left and the text of each page on the right, with the current passage marked. The talk runs about 139 minutes at 1× across 82 pages in five acts. It moves from one agent to a network, through what a message carries and what changes as it is passed on, to how such systems fail and what evidence supports relying on them.

Each page carries a label stating what kind of evidence it shows. An illustrative rule is a small model whose outcomes follow from rules the talk states. A measured agent system reports what implemented agents did in a published study. Human-group studies, engineering reports, simulations and untested hypotheses are labeled as such. The talk cites 110 sources, listed in the player.

- **Live:** https://communicatingagents.eric-c-gladstone.workers.dev
- **Also at:** https://graystoneindustries.co/talks/#communicating-agents (embedded)

## Use

Press play, or step through the talk one passage at a time with ‹ › (or the arrow keys). The reading panel shows the whole page. Hold keeps the text where you are reading while the stage continues, and the page menu jumps to any page. Each page also has a direct link (`#page-id`). `?embed=1` hides the page header and the text drawers so the player can sit inside a frame.

Run locally with any static server, for example `python3 -m http.server 8970 --directory public`.

## Files

`public/` is the whole site:
- `index.html`, the player (`player.js`, `player.css`), the timed text (`timeline.js`) and the reference list (`sources.js`);
- the stage in `deck/`, with one scene file per act in `deck/scenes/` and the toy models in `deck/models.js`;
- self-hosted Geist fonts.

It makes no third-party requests.

`sync.sh` copies the site from the working project into `public/`. Deploy with `npx wrangler deploy`.
