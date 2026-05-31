# running

A tiny static invite page for asking friends if they want to come running.

## Edit the invite

Change the values in `script.js`:

```js
const runDetails = {
  when: "Saturday morning",
  where: "Local park loop",
  pace: "Conversational",
  message: "I am heading out for a relaxed run and wanted to see who fancies joining."
};
```

## Publish on GitHub Pages

Create a public GitHub repo named `running`, then push this folder:

```powershell
git init
git add .
git commit -m "Initial running invite"
git branch -M main
git remote add origin https://github.com/serge-21/running.git
git push -u origin main
```

In GitHub, open `serge-21/running` and set:

- Settings -> Pages
- Source: Deploy from a branch
- Branch: main
- Folder: / root

The page should be available at:

```text
https://serge-21.github.io/running/
```
