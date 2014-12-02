#! /usr/bin/env node
'use strict';

var fs = require('fs'),
  path = require('path'),
  mjAPI = require('MathJax-node/lib/mj-single.js');

var getInputFiles = function(dir) {
  if( dir[dir.length-1] != '/') dir=dir.concat('/');
    var filelist = [],
      files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (!fs.statSync(dir + file).isDirectory()) {
      if (path.extname(file) === '.tex') {
        filelist.push(dir + file);
      }
    }
  });
  return filelist;
};

var writeFile = function(out, type) {
  return function(data) {
    var outName = out + '.' + type;
    if (!data.errors) {
      fs.writeFile(outName, data[type], function (err) {
        if (err) throw err;
        console.log(outName + ', It\'s saved!');
      });
    } else {
      console.error('Error', outName, data.errors);
    }
  };
};

var convert = function(mjAPI, argv, output, filename) {
  return function (err, data) {
    var out = output + '/' + path.basename(filename, '.tex');
    if (err) throw err;
    if (argv.png) {
      mjAPI.typeset({
        math: data,
        format: (argv.inline ? 'inline-TeX' : 'TeX'),
        png: true, dpi: argv.dpi,
        ex: argv.ex, width: argv.width,
        linebreaks: argv.linebreaks
      }, writeFile(out, 'png'));
    }
    if (argv.svg) {
      mjAPI.typeset({
        math: data,
        format: (argv.inline ? 'inline-TeX' : 'TeX'),
        svg: true,
        speakText: argv.speech,
        speakRuleset: argv.speechrules.replace(/^chromevox$/i, 'default'),
        speakStyle: argv.speechstyle,
        ex: argv.ex, width: argv.width,
        linebreaks: argv.linebreaks
      }, writeFile(out, 'svg'));
    }
    if (argv.mml) {
      mjAPI.typeset({
        math: data,
        format: (argv.inline ? 'inline-TeX' : 'TeX'),
        mml: true,
        speakText: argv.speech,
        speakRuleset: argv.speechrules.replace(/^chromevox$/i, 'default'),
        speakStyle: argv.speechstyle
      }, writeFile(out, 'mml'));
    }
  };
};


var argv = require('yargs')
  .demand(2).strict()
  .usage('Usage: index [options] inputpath outputpath', {
    mml: {
      boolean: true,
      describe: 'Build MathML file'
    },
    png: {
      boolean: true,
      describe: 'Build PNG file'
    },
    svg: {
      boolean: true,
      describe: 'Build SVG file'
    },
    inline: {
      boolean: true,
      describe: 'process as in-line TeX'
    },
    linebreaks: {
      boolean: true,
      describe: 'perform automatic line-breaking'
    },
    speech: {
      boolean: true,
      describe: 'include speech text'
    },
    speechrules: {
      default: 'mathspeak',
      describe: 'ruleset to use for speech text (chromevox or mathspeak)'
    },
    speechstyle: {
      default: 'default',
      describe: 'style to use for speech text (default, brief, sbrief)'
    },
    semantics: {
      boolean: true,
      describe: 'add TeX code in <semantics> tag'
    },
    notexhints: {
      boolean: true,
      describe: 'dont add TeX-specific classes'
    },
    dpi: {
      default: 144,
      describe: 'dpi for image'
    },
    font: {
      default: 'Tex',
      describe: 'web font to use'
    },
    ex: {
      default: 6,
      describe: 'ex-size in pixels'
    },
    width: {
      default: 100,
      describe: 'width of container in ex'
    }
  })
  .argv;

if (argv.font === 'STIX') {
  argv.font = 'STIX-Web';
}

var inputFiles = getInputFiles(argv._[0]),
  output = argv._[1];

mjAPI.config({MathJax: {SVG: {font: argv.font}}});
mjAPI.start();

for (var i = 0; i < inputFiles.length; i++) {
  fs.readFile(
    inputFiles[i],
    'utf8',
    convert(mjAPI, argv, output, inputFiles[i])
  );
}
