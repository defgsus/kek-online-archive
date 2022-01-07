import os
import sys
import json
import fnmatch
from pathlib import Path
from typing import Optional, List, Generator, Tuple, Dict, Union

import requests


class Kek:
    """
    Scraper for media-ownership-data from

    https://kek-online.de
    "Kommission zur Ermittlung der Konzentration im Medienbereich"

    There is an undocumented json API at ``medienvielfaltsmonitor.de/api/v1/``

    First call will bootstrap all data to a cache directory
    and consumes a few minutes..
    """

    DOWNLOAD_DIR: Path = Path(__file__).resolve().parent.parent / "docs" / "data"
    API_URL = "https://medienvielfaltsmonitor.de/api/v1/"

    def __init__(self, caching: Union[bool, str] = True, verbose: bool = False):
        """
        Create an instance to scrape and load the kek data.

        :param caching:
            - `True`: never request a file unless it's missing
            - `False`: request all files!
            - `"upgrade"`: (re-)request media.json and shareholders.json
              and all files that have a changed 'controlDate'

        :param verbose: bool, log stuff to stderr
        """
        assert caching in (True, False, "upgrade")

        self.caching = caching
        self.verbose = verbose
        self._medias = dict()
        self._holders = dict()
        self._session = None

    def get(self, squuid) -> Optional["KekObject"]:
        if squuid in self.medias:
            return self._medias[squuid]
        elif squuid in self.holders:
            return self._holders[squuid]

    def find_media(self, **kwargs) -> Optional["KekObject"]:
        for r in self.filter_media(**kwargs):
            return r

    def find_holder(self, **kwargs) -> Optional["KekObject"]:
        for r in self.filter_holder(**kwargs):
            return r

    def filter_media(self, **kwargs) -> Generator["KekObject", None, None]:
        yield from self._filter(self.medias, filters=kwargs)

    def filter_holder(self, **kwargs) -> Generator["KekObject", None, None]:
        yield from self._filter(self.holders, filters=kwargs)

    def _filter(self, data: dict, filters: dict) -> Generator["KekObject", None, None]:
        for record in data.values():
            matches = True
            for field, value in filters.items():
                # TODO: does only support strings and no dotted paths
                if not fnmatch.fnmatch(record.get(field) or "", value):
                    matches = False
                    break

            if matches:
                yield record

    @property
    def medias(self) -> Dict[str, "KekObject"]:
        if not self._medias:
            self._medias = self._get_object_dict("media/", "media")
        return self._medias

    @property
    def holders(self) -> Dict[str, "KekObject"]:
        if not self._holders:
            self._holders = self._get_object_dict("shareholders/", "shareholders")
        return self._holders

    def _get_object_dict(self, url: str, filename: str) -> Dict[str, "KekObject"]:
        squuid_date_mapping = dict()
        caching = self.caching
        if caching == "upgrade":
            caching = False
            cache_filename = self.DOWNLOAD_DIR / f"{filename}.json"
            if cache_filename.exists():
                previous_object_list = json.loads(cache_filename.read_text())
                squuid_date_mapping = {
                    e["squuid"]: e.get("controlDate")
                    for e in previous_object_list
                }

        object_list = self._download(url, f"{filename}.json", caching=caching)

        ret_dict = dict()
        for e in object_list:

            caching = self.caching
            if caching == "upgrade":
                caching = True
                if squuid_date_mapping.get(e["squuid"]) \
                        and squuid_date_mapping[e["squuid"]] != e.get("controlDate"):
                    caching = False

            data = self._download(
                f"{url}{e['squuid']}",
                f"{filename}/{e['squuid']}.json",
                caching=caching,
            )
            ret_dict[e["squuid"]] = KekObject(self, data)

        return ret_dict

    def to_igraph(self):
        import igraph
        graph = igraph.Graph(directed=True)
        v_map = dict()
        edges = []
        edge_attrs = {"weight": [], "type": []}
        for holder in self.holders.values():
            v_map[holder["squuid"]] = graph.add_vertex(
                holder["name"], type="owner"
            )
            for sub, share in holder.owns:
                if not v_map.get(sub["squuid"]):
                    v_map[sub["squuid"]] = graph.add_vertex(sub["name"], type="owner")

                edges.append((holder["name"], sub["name"]))
                edge_attrs["weight"].append(max(1, share))
                edge_attrs["type"].append("owns")

            for sub in holder.operates:
                if not v_map.get(sub["squuid"]):
                    v_map[sub["squuid"]] = graph.add_vertex(sub["name"], type="media")

                edges.append((holder["name"], sub["name"]))
                edge_attrs["weight"].append(100)
                edge_attrs["type"].append("operates")

        graph.add_edges(edges, edge_attrs)
        return graph

    def _download(
            self,
            url: str,
            filename: str,
            caching: Optional[bool] = None,
    ) -> Union[list, dict]:
        if caching is None:
            caching = self.caching

        cache_filename = self.DOWNLOAD_DIR / filename
        if caching and cache_filename.exists():
            return json.loads(cache_filename.read_text())

        url = f"{self.API_URL}{url}"
        self._log("downloading", url)
        if self._session is None:
            self._session = requests.Session()
            self._session.headers = {
                "User-Agent": "github.com/defgsus/kek-online-archive",
                "Accept": "application/json; encoding=utf-8",
            }
        response = self._session.get(url)

        self._log("writing", filename)

        path = cache_filename.parent
        os.makedirs(str(path), exist_ok=True)

        data = response.json()

        cache_filename.write_text(
            json.dumps(data, indent=2, ensure_ascii=False)
        )
        return data

    def _log(self, *args, **kwargs):
        if self.verbose:
            kwargs["file"] = sys.stderr
            print(*args, **kwargs)


class KekObject(dict):

    def __init__(self, kek: Kek, data: dict):
        # take the invalidated data on schema errors
        #   e.g. for shareholders/5f02e1b5-ec52-455e-a186-0ad6bd8d6b61
        if not data.get("squuid") and data.get("errors"):
            data = data["value"]

        super().__init__(**data)
        self._kek = kek
        self._hash = int(self["squuid"].replace("-", ""), base=16)

    def __str__(self):
        return json.dumps(self, indent=2)

    def __hash__(self):
        return self._hash

    @property
    def name(self) -> str:
        return self.get("fullName") or self["name"]

    def is_media(self) -> bool:
        return "operatedBy" in self

    @property
    def operators(self) -> List["KekObject"]:
        if "operatedBy" not in self:
            return []
        return [
            #KekObject(self._kek, o)
            self._kek.get(o["holder"]["squuid"])
            for o in self["operatedBy"]
        ]

    @property
    def operates(self) -> List["KekObject"]:
        if "operates" not in self:
            return []
        return [
            self._kek.get(o["held"]["squuid"])
            for o in self["operates"]
        ]

    @property
    def owners(self) -> List[Tuple["KekObject", float]]:
        if "ownedBy" not in self:
            return []
        return [
            (self._kek.get(o["holder"]["squuid"]), o.get("capitalShares", 0))
            for o in self["ownedBy"]
        ]

    @property
    def owns(self) -> List[Tuple["KekObject", float]]:
        if "owns" not in self:
            return []
        return [
            (self._kek.get(o["held"]["squuid"]), o.get("capitalShares", 0))
            for o in self["owns"]
        ]

    def top_owners(self):
        if self.is_media():
            open_set = {op: 1. for op in self.operators}
        else:
            open_set = {owner: percent for owner, percent in self.owners}

        histogram = dict()
        done_set = set()
        while open_set:
            holder, share = open_set.popitem()
            histogram[holder] = histogram.get(holder, 0) + share

            for owner, percent in holder.owners:
                if (holder, owner) not in done_set:
                    # print(holder.name, ">", owner.name, "|", share, percent / 100)
                    open_set[owner] = open_set.get(owner, 0) + share * percent / 100.

                done_set.add((holder, owner))
        histogram = [
            (owner, histogram[owner] * 100)
            for owner, value in histogram.items()#sorted(histogram, key=lambda h: -histogram[h])
        ]
        histogram.sort(key=lambda h: h[0].name)
        histogram.sort(key=lambda h: -h[1])
        return histogram

    def dump_tree(self, direction: str = "up", prefix: str = "", prefix2: str = "", file=None, _cache=None):
        if _cache is None:
            _cache = set()

        s = self.name
        if self.get("type"):
            s = f"({self['type']}) {s}"
        print(f"{prefix}{prefix2}{s}", file=file)

        prefix = prefix.replace("└", " ").replace("─", " ").replace("├", "│")

        if direction == "up":
            branches = self.operators or self.owners
        elif direction == "down":
            branches = self.operates or self.owns
        else:
            raise ValueError(f"Try direction 'up' or 'down', not '{direction}'")

        if branches and isinstance(branches[0], tuple):
            branches.sort(key=lambda b: -b[1])
        else:
            branches.sort(key=lambda b: b.name)

        if self in _cache:
            if branches:
                print(f"{prefix}└─...")
                return
        _cache.add(self)

        for i, b in enumerate(branches):
            prefix2 = ""
            if isinstance(b, tuple):
                prefix2 = f"{b[1]} "
                b = b[0]

            if i == len(branches) - 1:
                next_prefix = "└─"
            else:
                next_prefix = "├─"
            b.dump_tree(direction=direction, prefix=prefix + next_prefix, prefix2=prefix2, file=file, _cache=_cache)


if __name__ == "__main__":

    kek = Kek(verbose=True, caching="upgrade")
    print(len(kek.medias), "medias")
    print(len(kek.holders), "shareholders")

