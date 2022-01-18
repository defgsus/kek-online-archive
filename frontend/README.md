### github pages for `kek-online-archive`

Visit at [defgsus.github.io/kek-online-archive/](https://defgsus.github.io/kek-online-archive/)

To run the site for development call:

```
cd frontend/
./run-server.sh
```

It will start an additional file server in the `/docs` directory using python.

To compile run 

`publish.sh`

It will copy `dist/index.html` to `../docs/index.html` and the js and css files
to `../docs/js/` as they seem to not be delivered when placed directly into `../docs/`.
