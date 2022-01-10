from src.kek import Kek, KekObject

def main():
    kek = Kek(verbose=True, caching="upgrade")
    print(len(kek.medias), "media")
    print(len(kek.holders), "shareholders")

    graph = kek.to_igraph()
    graph.vs["in_degree"] = graph.indegree()
    graph.vs["out_degree"] = graph.outdegree()
    print("writing", Kek.DOWNLOAD_DIR / "graph.dot")
    graph.write_dot(str(Kek.DOWNLOAD_DIR / "graph.dot"))


if __name__ == "__main__":
    main()
