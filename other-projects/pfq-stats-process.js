import fs from 'fs';
import readline from 'readline';

async function processLineByLine() {
    const fileStream = fs.createReadStream('pfq-stats.csv');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    let isFirst = true;
    let output = '<div style="overflow-x: auto">\r\n{| {{Tb1}} class="wikitable sortable"';
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        // console.log(`Line from file: ${line}`);
        const stats = line.split(',');
        for(const cell of stats) {
            if(isFirst) {
                output += '\r\n! {{Tb2}} | '+cell;
            }
            else {
                output += '\r\n| {{Tb3}} | '+cell;
            }
        }
        output += '\r\n|-';
        if(isFirst) {
            isFirst = false;
        }
    }
    output += '\r\n|}\r\n</div>'
    await fs.promises.writeFile('pfq-stats-wiki.txt', output);
}

processLineByLine();