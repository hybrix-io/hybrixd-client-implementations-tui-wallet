// global variables
nodepath = 'http://127.0.0.1:8080/api/';
//nodepath = 'https://wallet.coinstorm.net:443/api/';

var nbsp = ' ';   // Non-breaking space for correct UI responsiveness

lang = {
  alertTitle:'Alert',
  alertError:'Error',
  modalSendTxTitle:'Send transaction',
  modalSendTxText:'Amount available to send from this account: %amount%'+nbsp+'%symbol%',
  modalSendTxFee:'Network fee: %fee%'+nbsp+'%symbol%',
  modalSendTxTo:'Send to',
  modalSendTxAmount:'Send amount',
  modalSendTxFrom:'From address: %from%',
  modalSendTxImpossible:'No funds can be sent from this acount at the moment.',
  modalSendTxErrorDcode:'Error: Deterministic code was not properly initialized! Please ask the Internet of Coins developers to fix this.',
  modalSendTxFailed:'Sorry, but the node told us the transaction failed!',
  modalRecvTxTitle:'Receive transaction',
  modalRecvTxText:'To receive %symbol% transactions,\ndeposit to this address',
  modalAdvTitle:'Advanced actions',
  modalAdvText:'Advanced asset actions are a work in progress and currently not yet available.',
  buttonCopyClip:'Copy to clipboard',
  buttonSendTx:'Send transaction', buttonOK:'Okay',buttonCancel:'Cancel',buttonClose:'Close',
  buttonSend:'Send', buttonRecv:'Receive', buttonAdv:'+', buttonMax:'Max',
  buttonQuit:'{bold}q{/bold}uit',
  buttonTerminal:'{bold}t{/bold}erminal',
  buttonLogger:'{bold}l{/bold}og',
  terminalDescription:'In this terminal you can enter commands that will be sent directly to the hybridd node. If a response contains a process ID, pressing [enter] again will show the contents of that process.'
};

GL = { session:false, sessiondata:null, vars:{} };

init = {};
cached = {};
fetchview_path = null;
fetchview_time = 0;
wrapperlib = {};

UI = {};
UI.edit = {};
UI.edit.hist = [];
UI.text = {};
UI.spinner = {};
UI.spinner.text = {};

intervals = {};   // stores timing intervals

// asset variables
assets = {};      // list of assets
assets.count = 0; // amount of assets
assets.init = []; // initialization of assets
assets.mode = {}; // mode of assets
assets.modehashes = {}; // hashes of modes
assets.seed = {}; // cryptoseeds of assets
assets.keys = {}; // keys of assets
assets.addr = {}; // public addresses of assets
assets.fact = {}; // factor of assets
assets.fees = {}; // fees of assets

// global compatibility functions
alert = function(title,text) {
  if(typeof text!='undefined') {
    UI.modalfunc.alert(title,text);
  } else {
    UI.modalfunc.alert(lang.alertTitle,title);
  }
}

logger = function(text) {
  if(typeof UI!='undefined' && typeof UI.logger!='undefined') {
    UI.logger.insertBottom(text);
  } else { console.log(text); }
}

spinnerStart = function(element) {
  if(typeof UI.spinner.text[element] != 'undefined') { clearInterval(UI.spinner.text[element].interval); }
  UI.spinner.text[element]={}
  UI.spinner.text[element].count = 0;
  if(typeof UI.text[element]!='undefined') {
    var len=UI.text[element].getText().length;
  } else {
    var len=UI.edit[element].getText().length;
    UI.spinner.text[element].prev = UI.edit[element].getContent();
  }
  var spca='',spcb='';
  if(len>3) {
    for(var i=1;i<(len/2);i=i+1) { spca=spca+' '; }
    for(var i=2;i<(len/2)+(len%2);i=i+1) { spcb=spcb+' '; }
  }
  UI.spinner.text[element].interval = setInterval( function() {
    var widg='';
    switch(UI.spinner.text[element].count) {
      case 0: widg=spca+'•  '+spcb; break;
      case 1: widg=spca+' • '+spcb; break;
      case 2: widg=spca+'  •'+spcb; break;
      case 3: widg=spca+' • '+spcb; break;
    }
    if(UI.spinner.text[element].count>2) { UI.spinner.text[element].count = 0; } else { UI.spinner.text[element].count++; }
    if(typeof UI.text[element]!='undefined') {
      UI.text[element].setContent(widg);
    } else {
      UI.edit[element].setContent(widg);
    }
    screen.render();                
  },100);
}

spinnerStop = function(element) {
  if(typeof UI.spinner.text[element].prev != 'undefined') { UI.edit[element].setContent(UI.spinner.text[element].prev); }
  if(typeof UI.spinner.text[element] != 'undefined') { clearInterval(UI.spinner.text[element].interval); delete UI.spinner.text[element]; }
}