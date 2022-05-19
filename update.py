from src.kek import Kek, KekObject


def main():
    kek = Kek(verbose=True, caching=True)#"upgrade")
    print(len(kek.medias), "media")
    print(len(kek.holders), "shareholders")

    graph = kek.to_igraph()
    graph.vs["in_degree"] = graph.indegree()
    graph.vs["out_degree"] = graph.outdegree()
    print("writing", Kek.DOWNLOAD_DIR / "graph.dot")
    graph.write_dot(str(Kek.DOWNLOAD_DIR / "graph.dot"))


def get_all_keys():
    """
    Dump all fieldnames of medias and holders
    """
    kek = Kek(verbose=False, caching=True)
    media_keys = set()
    holder_keys = set()
    for media in kek.medias.values():
        for key in media.keys():
            media_keys.add(key)
            # if key == "rfShoppingChannel":
            #     print(media[key])
    for holder in kek.holders.values():
        for key in holder.keys():
            holder_keys.add(key)

    print("media keys:")
    for key in sorted(media_keys):
        print(" ", key)

    print("\nholder keys:")
    for key in sorted(holder_keys):
        print(" ", key)


if __name__ == "__main__":
    main()
    # get_all_keys()

