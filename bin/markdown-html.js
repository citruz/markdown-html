#!/usr/bin/env node

var markdown = require('node-markdown').Markdown;
var fs = require('fs');
var path = require('path');
var mustache = require('mu2');
var util = require('util');

// Tempalte dir - need to be set before options evaluation
var templateDir = __dirname + '/../template';

// Optimist command-line options
var optimist =  require('optimist')
    .alias({
        't': 'title',
        'l': 'template',
        's': 'style',
        'j': 'script',
        'h': 'help',
        'o': 'output-file',
        'i': 'stdin'
    })
    .describe({
        'title': 'Generated page title',
        'style': 'Path to custom stylesheet',
        'script': 'Path to custom javascript',
        'template': 'Path to custom mustache template',
        'help': 'This screen',
        'output-file': 'Path to output file (stdout if not specified)',
        'stdin': 'If set, stdin will be used instead of file'
    })
    .default({
        'style': path.resolve(templateDir + '/style.css'),
        'template': path.resolve(templateDir + '/template.html')
    });
var argv = optimist.argv;

// Help
if (argv.help) {
    optimist.showHelp(console.log);
    process.exit(0);
}


if (argv.i) {

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
     
    process.stdin.on('data', function (chunk) {
        runWithContent(chunk);
    });

} else { 

    // Get generate html from md.
    var input = argv._[0];
    if (!input) {
        return;
    }
    runWithContent(fs.readFileSync(input, 'utf-8'));

}

function runWithContent(content) {

    content = markdown(content);

    // File existance check
    if (!fs.existsSync(argv.template)) {
        throw new Error('Template does not exist.');
    }

    if (!fs.existsSync(argv.style)) {
        throw new Error('Style does not exist.');
    }

    if (argv.script && !fs.existsSync(argv.script)) {
        throw new Error('Script does not exist.');
    }

    // Set title.
    var title = argv.title ? argv.title : path.basename(input, path.extname(input));

    // Load style.
    var style = fs.readFileSync(argv.style);

    // Load script
    var script = argv.script ? fs.readFileSync(argv.script) : '';

    // Output
    var out = process.stdout;
    if (argv['output-file']) {
        out = fs.createWriteStream(path.resolve(argv['output-file']));
    }

    // Compile template and pipe it out.
    mustache.compileAndRender(argv.template, { 
        content: content,
        style: style,
        title: title,
        script: script
    }).pipe(out);
}