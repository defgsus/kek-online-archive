## archive of [kek-online.de](https://www.kek-online.de/medienkonzentration/mediendatenbank#/)

The *Kommission zur Ermittlung der Konzentration 
im Medienbereich* (KEK), collects and publishes shareholding
information about german newspapers, radio and tv stations and
online services. 

This archive stores a daily snapshot of their undocumented 
json web API. The files are:

- `docs/data/media.json` (from https://medienvielfaltsmonitor.de/api/v1/media/)
  
  This is a list of all medias in the KEK database. 
  
- `docs/data/shareholders.json` (from https://medienvielfaltsmonitor.de/api/v1/shareholders/)

  That's the list of all shareholders and operators/publishers.
  
  All media and shareholders are identified by UUIDs and more
  detailed information for each *entity* is available 
  in the following files:

- `docs/data/media/` 
  - `5be1a6b1-0a0b-42ac-b845-1914e17d572f.json` (from https://medienvielfaltsmonitor.de/api/v1/media/5be1a6b1-0a0b-42ac-b845-1914e17d572f)
  - ...
- `docs/data/shareholders/` 
  - `5be1a6b6-0a00-491b-9229-bfd0da590573.json` (from https://medienvielfaltsmonitor.de/api/v1/shareholders/5be1a6b6-0a00-491b-9229-bfd0da590573)
  - ...

All data is copyright:
[*Kommission zur Ermittlung der Konzentration im Medienbereich (KEK)*](https://www.kek-online.de/impressum).

---

To build the complete graph of shareholders and media, you need
to parse the individual files in `docs/data/shareholders/` or load
the `docs/data/graph.dot` file. The `dot` format for graphs is 
widely supported, for example by:

- The [Graphviz](https://graphviz.org/) commandline tools
- The [igraph](https://igraph.org/) library for R, Python, Mathematica and C
- The [vis.js](https://visjs.org/) library for Javascript
- The [Gephi](https://gephi.org/) application for Mac, Windows and Linux

From my experience, the fastest way of layouting the graph is Gephi:
Load the dot file, select "ForceAtlas2" in the "Layouter" and "run"
the thing.

