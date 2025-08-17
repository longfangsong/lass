# Fetch meanings

This script fetch xml format dictionary from [lexin](https://lexin.nada.kth.se/lexin/) and [folkets lexikon](http://folkets-lexikon.csc.kth.se/folkets/),
parse them and generate the file for importing into the database.

This should **not** be executed or edited after releasing. But it is still kept here for reference.

## Use

There should be already a `data` folder in the project root, and a SQL file `dictionary.sql` in it.

To import it into your development database, run:

```bash
# under project_root
npx wrangler d1 execute DB --file ./data/dictionary.sql
```

If you update this script, you should run it again to update the `dictionary.sql` file.

```bash
# under <project_root>/scripts/fetch_meanings/
npm run run
cp ./dictionary.sql ../../data/dictionary.sql
```
