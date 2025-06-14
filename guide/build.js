
import fs from 'fs';
import replaceAsync from 'string-replace-async';

const globalPath = 'guide/';

runBuild();
async function runBuild() {
  if (!fs.existsSync(globalPath+'build')){
    fs.mkdirSync(globalPath+'build');
  }
  buildPost('bbcode');
  buildPost('css');
}

async function buildPost(postName) {
  var relPath = globalPath+postName+'/';
  var content = await fs.promises.readFile(relPath+'index.txt', 'utf8');
  var newContent = await loadResources(content, relPath);
  await fs.promises.writeFile(globalPath+'build/'+postName+'.txt', newContent);
}

async function loadResources(content, relPath) {
    return replaceAsync(content, /"?<%([^"<>%]+)%>"?/g, async function(match, replacePath) {
        replacePath = replacePath.trim();
        return fs.readFileSync(relPath+replacePath, 'utf8');
    });
}
