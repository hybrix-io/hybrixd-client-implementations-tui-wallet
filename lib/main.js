// globals
require('./globals');

// global requires
fs = require('fs');
path = require('path');
storage = require('./storage');
nacl = require('./crypto/nacl');
crypto = require('crypto');
LZString = require('./crypto/lz-string');
Decimal = require('./crypto/decimal-light'); Decimal.set({ precision: 64 });  // high precision for nonces
UrlBase64 = require('./crypto/urlbase64');
hex2dec = require('./crypto/hex2dec');
najax = require('najax');                   // replacement for Jquery AJAX
blessed = require('blessed');
clipboardy = require('clipboardy');
jsdom = require('jsdom');
require('./hybriddcall');                   // hybriddcall 

// UI requires
UI.views = {};
require('./views/assets');                  // view: assets
UI.buttonfunc = require('./buttons');       // button functions
UI.modalfunc = require('./modal');          // modal functions

// command line arguments

if (process.argv.length < 3) {
    console.error('Please specify account ID, and password.');
    process.exit(1);
}
// DEBUG: console.log(process.argv[2]+' '+process.argv[3]);

// login deterministically
var userid = process.argv[2];
var passwd = process.argv[3];
if ( userid.length == 16 && (passwd.length == 16 || passwd.length == 48) ) {
  session_step = 0;
  require('./login.js').login( userid,passwd );
  function sessionWait() {
      if(GL.session == false) {
        process.stdout.write('.');
        setTimeout(sessionWait, 1000);
      } else {
        process.stdout.write(".\n");
        /* DEBUG TEST
        var usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };
        var cur_step = next_step();
        hybriddcall({r:'a/btc/balance/1ATDudWEEZmB2TKcEehZwUX2i3wBxQrSDK',z:0},null,
                        function(object){
                          console.log(object);
                          if(typeof object.data=='string') { object.data = formatFloat(object.data); }
                          console.log(object.data);
                        }
                      );
        */
        return main();
      }
  }
  sessionWait();
} else {
    console.error('Please specify an account ID, and password of the right length.');
}


// render main wallet screen
function main() {
  // create a screen object.
  screen = blessed.screen({smartCSR:true,dockBorders:true});
  screen.title = 'Internet of Coins wallet';

  // Create a box perfectly centered horizontally and vertically.
  UI.topbar = blessed.box({
    top: 0,
    left: '0%-1',
    width: '100%+1',
    height: 1,
    content: ' {bold}Internet of Coins{/bold}{|}{bold}{blue-fg}'+GL.session.userid+'{/blue-fg}{/bold}  ',
    tags: true,
    draggable: false,
    border: false,
    terminal: 'xterm-256color',
    fullUnicode: true,    
    style: {
      fg: 'white', bg: 'blue'
    }
  });

  UI.lowbar = blessed.box({
    bottom: 0,
    left: '0%-1',
    width: '100%+1',
    height: 1,
    tags: true,
    draggable: false,
    border: false,
    style: {
      fg: 'white', bg: 'blue'
    }
  });

  UI.box = blessed.box({
    top: 1,
    left: '0%',
    width: '100%',
    height: '100%-2',
    label: '',
    align: 'center',
    content: '',
    tags: true,
    draggable: false,
    border: false,
    style: {
      fg: 'white',
      bg: 'transparent',
    },
    keys: true,
    vi: false,
    alwaysScroll:true,
    scrollable: true,
    scrollbar: {
      style: {
        bg: 'yellow'
      }
    }    
  });

  UI.modal = blessed.box({
    parent: UI.box,
    mouse: true,
    keys: true,    
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    label: '',
    align: 'center',
    content: '',
    draggable: false,
    hidden: true,
    border: false,
    transparent: true,
  });  
  
  UI.logger = blessed.log({
    parent: UI.box,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    label: '{bold} Log {/bold}',
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: false,
    draggable: true,
    hidden: true,
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true
      }
    }    
  });

  UI.terminal = blessed.box({
    parent: UI.box,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    padding: {bottom:1},
    label: '{bold} API Terminal {/bold}',
    border: 'line',
    tags: true,
    hidden: true,
  });

  UI.terminal.hist = blessed.log({
    parent: UI.terminal,
    top: 0,
    left: 0,
    width: '100%-2',
    height: '100%-3',
    border: false,
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    draggable: false,
    content: lang.terminalDescription+'\n',
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true,
        bg: 'black'
      }
    }    
  });
    
  UI.terminal.line = blessed.textbox({
    parent: UI.terminal,
    mouse: true,
    bottom: -1,
    left: 0,
    width: '100%-2',
    height: 1,
    align: 'left',
    style: {
      fg: 'black', bg: 'white'
    }                        
  });

  UI.terminal.cmdindex = 0;
  UI.terminal.cmds = [];
  UI.terminal.lastresult = {};

  UI.terminal.line.on('focus', function() {
    UI.terminal.line.readInput();
  });

  UI.terminal.line.key(['pageup'], function(ch, key) {
    UI.terminal.hist.scroll(-5);
    screen.render();
  });

  UI.terminal.line.key(['pagedown'], function(ch, key) {
    UI.terminal.hist.scroll(5);
    screen.render();
  });

  UI.terminal.line.key(['up'], function(ch, key) {
    if(UI.terminal.cmdindex>0) {
      UI.terminal.cmdindex--;
    }
    UI.terminal.line.setValue(UI.terminal.cmds[UI.terminal.cmdindex]);
    screen.render();
  });
  
  UI.terminal.line.key(['down'], function(ch, key) {
    if(UI.terminal.cmdindex<UI.terminal.cmds.length) {
      UI.terminal.cmdindex++;
      UI.terminal.line.setValue(UI.terminal.cmds[UI.terminal.cmdindex]);
    } else {
      UI.terminal.line.setValue('');
    }
    screen.render();
  });

  UI.terminal.line.key(['enter'], function(ch, key) {
    var command = UI.terminal.line.getValue();
    if(command=='' && typeof UI.terminal.lastresult.id != 'undefined') {
      if(UI.terminal.lastresult.id=='id') {
        command = '/proc/'+UI.terminal.lastresult.data;
      }
    }
    UI.terminal.cmds.push(command);
    if(UI.terminal.cmds.length>1000) {
      UI.terminal.cmds.shift();
    }
    UI.terminal.cmdindex=UI.terminal.cmds.length;
    UI.terminal.line.setValue('');
    UI.terminal.line.focus();
    screen.render();
    var cur_step = next_step();
    var usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };
    logger('[terminal TX]\n'+path+zchan(usercrypto,cur_step,command));
    najax({ url: nodepath+zchan(usercrypto,cur_step,command),
      success: function(object) {
        logger('[terminal RX]\n'+object);
        object = zchan_obj(usercrypto,cur_step,object);
        UI.terminal.lastresult = object;
        UI.terminal.hist.insertBottom(JSON.stringify(object)+'\n');
        UI.terminal.hist.scroll(5)
        screen.render();
      },
      failure: function(object) {
        UI.terminal.hist.insertBottom('{red}Error: remote node not responding!{/red}');
        screen.render();
      }
    });
  });

  UI.terminal.line.key(['escape'], function(ch, key) {
    UI.terminal.toggle();
    UI.activated.focus();
    screen.render();    
  });
      
  
  UI.activated = UI.box;
  
  // Switch to assets view
  UI.views.assets();

  // Append our elements to the screen.
  screen.append(UI.topbar);
  screen.append(UI.lowbar);
  screen.append(UI.box);

  //
  // Extra button handling
  //

  // Add functions to lowbar UI.edit
  UI.edit.Logger = UI.buttonfunc.make('log',UI.lowbar,0,0,lang.buttonLogger);
  UI.edit.Logger.on('press', function() {
    UI.logger.toggle();
    UI.logger.setFront();
    screen.render();    
  });
  UI.edit.Terminal = UI.buttonfunc.make('terminal',UI.lowbar,'center',0,lang.buttonTerminal);
  UI.edit.Terminal.on('press', function() {
    UI.terminal.toggle();
    UI.terminal.setFront();
    UI.terminal.line.focus();
    screen.render();
  });
  UI.edit.Quit = UI.buttonfunc.make('quit',UI.lowbar,-1,0,lang.buttonQuit);
  UI.edit.Quit.on('press', function() {
    screen.destroy();
    process.exit(0);    // TODO: hard exit is not best solution; must be fixed!
  });


  //
  // Keyboard handling
  //

// unkey(name, listener) - Remove a keypress listener for a specific key.

  // Cycle between button groups
  screen.key(['tab', 'f', '>'], function(ch, key) {
    UI.edit.group++;
    if(UI.edit.group>=UI.edit.cycles.length) { UI.edit.group=0; }
    UI.edit.ocycl=UI.edit.cycle;
    UI.edit.cycle=UI.edit.cycles[UI.edit.group];
    UI.edit.cfast = UI.edit.updown[UI.edit.group];
    UI.edit.focus = Math.floor(UI.edit.focus*(UI.edit.cycle.length/UI.edit.ocycl.length));
    UI.edit.focus = (UI.edit.focus<0?0:(UI.edit.focus>=UI.edit.cycle.length?UI.edit.cycle.length-1:UI.edit.focus));
    if(typeof UI.edit[UI.edit.cycle[UI.edit.focus]] != 'undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();  
    }
  });

  screen.key(['S-tab', 'r', '<'], function(ch, key) {
    UI.edit.group--;
    if(UI.edit.group<0) { UI.edit.group=UI.edit.cycles.length-1; }
    UI.edit.ocycl=UI.edit.cycle;
    UI.edit.cycle=UI.edit.cycles[UI.edit.group];
    UI.edit.cfast = UI.edit.updown[UI.edit.group];
    UI.edit.focus = Math.floor(UI.edit.focus*(UI.edit.cycle.length/UI.edit.ocycl.length));
    UI.edit.focus = (UI.edit.focus<0?0:(UI.edit.focus>=UI.edit.cycle.length?UI.edit.cycle.length-1:UI.edit.focus));
    logger('f: '+UI.edit.focus);
    if(typeof UI.edit[UI.edit.cycle[UI.edit.focus]] != 'undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();    
    }
  });

  // Cycle left/right between UI.edit
  screen.key(['right', 'd', '.'], function(ch, key) {
    UI.edit.focus++;
    if(UI.edit.focus>=UI.edit.cycle.length) { UI.edit.focus=-1; }
    if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
    } else {
      UI.activated.focus();
    }
  });

  screen.key(['left', 'a', ','], function(ch, key) {
    UI.edit.focus--;
    if(UI.edit.focus<-1) { UI.edit.focus=UI.edit.cycle.length-1; }
    if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
    } else {
      UI.activated.focus();
    }
  });

  // Cycle up/down between UI.edit
  screen.key(['down', 's', '}'], function(ch, key) {
    if(UI.edit.focus<=-1) {
      UI.edit.focus=0;
    } else {
      UI.edit.focus=UI.edit.focus+UI.edit.cfast;
    }
    if(UI.edit.focus>=UI.edit.cycle.length) { UI.edit.focus=UI.edit.focus-UI.edit.cycle.length; }
    if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
    } else {
      UI.activated.focus();
    }
  });

  screen.key(['up', 'w', '{'], function(ch, key) {
    if(UI.edit.focus<=-1) {
      UI.edit.focus=UI.edit.cycle.length-UI.edit.cfast;
    } else {
      UI.edit.focus=UI.edit.focus-UI.edit.cfast;
    }
    if(UI.edit.focus>=UI.edit.cycle.length) { UI.edit.focus=UI.edit.focus-UI.edit.cycle.length; }
    if(typeof UI.edit.cycle[UI.edit.focus]!='undefined') {
      UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
    } else {
      UI.activated.focus();
    }
  });
  
  // Cycle home/end between UI.edit
  screen.key(['end', 'S', '['], function(ch, key) {
    UI.edit.focus=UI.edit.cycle.length-1;
    UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
  });

  screen.key(['home', 'W', ']'], function(ch, key) {
    UI.edit.focus=0;
    UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
  });

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'Q'], function(ch, key) {
    screen.destroy();
    process.exit(0);    // TODO: hard exit is not best solution; must be fixed!
  });

  // Restart wallet app
  screen.key(['S-r'], function(ch, key) {
    screen.destroy();
    process.exit(255);    // TODO: hard exit is not best solution; must be fixed!
  });

  // Toggle log display
  screen.key(['l', 'L'], function(ch, key) {
    UI.logger.toggle();
    UI.logger.setFront();
    screen.render();    
  });

  // Toggle terminal display
  screen.key(['t', 'T'], function(ch, key) {
    UI.terminal.toggle();
    UI.terminal.setFront();
    UI.terminal.line.focus();
    screen.render();    
  });

  // DEBUG KEYPRESSES
  /* screen.on('keypress', function(ch, key) {
    logger('KEY: '+ch+' '+JSON.stringify(key));
  }); */
  
    // Focus our element.
  UI.activated.focus();

  // Render the screen.
  screen.render();
}