# K Util

This was made to free up space for Kaltura accounts by removing Source files from Media entries with flavors.

## Requirements

- Install [NodeJS](https://nodejs.org/)
- Install [Git](https://git-scm.com/)

## Getting started
Use git to clone this project to your computer, and then from a shell session in the downloaded project directory, run

```bash
npm install
```

After that get a Kaltura session token and add it to a file in the project directory named `config.json`.

The file should look like this
```json
{
    "session": "your-valid-session-token-goes-here-between-the-double-quotes"
}
```

When you're ready to remove the source files in your project, run
```bash
node kaltura-media-flavor-asset-cleanup.js
```

You'll be prompted before each deletion to confirm that you'd like to delete it. Alternatively, you can type `all` to allow all deletions to occur.

By default, this script doesn't delete anything and instead does a `dry run` to show which flavor asset IDs would be removed.

Once you're fully prepared to _permanently_ delete  your source flavor assets from your account forever, you need to run the script via

```bash
# WARNING this _will_ delete your source flavor assets
node kaltura-media-flavor-asset-cleanup.js --confirm
```