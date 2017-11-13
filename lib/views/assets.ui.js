UItransform = {
  txStart : function() {
        spinnerStart('SendTx');
      },
  txStop : function() {
        spinnerStop('SendTx');
      },
  txHideModal : function() {
        UI.modalfunc.destroy();
      },
  setBalance : function(element,setBalance) {
        element.setText(setBalance); // restore original amount
      },
  deductBalance : function(element,newBalance) {
        element.setContent('{red-fg}'+String(newBalance)+'{/red-fg}');
      }
}

displayAssets = function displayAssets(passdata) {
  // display assets
  var i=0;
  for (var entry in passdata) {
    balance.lasttx[i] = 0;
      
    //
    // UI fields
    //
    
    // height of each element group
    var y=3+(i*2);

    UI.text['AssetsS-'+balance.asset[i]] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: 0,
      top: y,
      tags: true,
      name: 'AssetsS-'+balance.asset[i],
      content: balance.asset[i].toUpperCase(),
      width: '25%',
      height: 1,
      style: {
        bg: 'transparent'
      }
    });

    UI.text['AssetsA-'+balance.asset[i]] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '25%',
      top: y,
      tags: true,
      name: 'AssetsA-'+balance.asset[i],
      content: '?',
      width: 16,
      height: 1,
      style: {
        bg: 'transparent'
      }
    });
      
    // UI.edit
    UI.edit.box.push('Send'+i);
    UI.edit['Send'+i] = UI.buttonfunc.make(lang.buttonSend,UI.box,-8-(lang.buttonAdv.length+lang.buttonRecv.length),y,0,'blue');
    UI.edit['Send'+i].on('press', function() {
      var asset = this.balance.asset[this.i];
      if(!isNaN(UI.text['AssetsA-'+asset].getText())) {
        if(!isToken(asset)) {
          var spendable = toInt(UI.text['AssetsA-'+asset].getText()).minus(toInt(assets.fees[asset]));
        } else {
          var spendable = toInt(UI.text['AssetsA-'+asset].getText());
        }
        if(spendable<0) { spendable=0; }
        
        UI.modalfunc.make(lang.modalSendTxTitle,
          '\n'+lang.modalSendTxText.replace('%amount%',fromInt(spendable)).replace('%symbol%',asset.toUpperCase())
        );

        var offset='25%';
        UI.text['Modalfield-1'] = blessed.text({
          parent: UI.modal.box,
          left: '10%', top: offset,tags:true,
          content: '{black-bg}'+lang.modalSendTxTo+' {/black-bg}',
          align: 'left', height: 1
        });
        UI.modalfunc.input('Target','10%',offset+'+1','80%');

        UI.text['Modalfield-2'] = blessed.text({
          parent: UI.modal.box,
          left: '10%', top: offset+'+3',tags:true,
          content: '{black-bg}'+lang.modalSendTxAmount+' {/black-bg}',
          align: 'left', height: 1
        });
        UI.modalfunc.input('Amount','10%',offset+'+4','80%-'+(3+lang.buttonMax.length));
        UI.edit['Max'] = UI.buttonfunc.make('Max',UI.modal.box,'89%-'+(2+lang.buttonMax.length),offset+'+4',lang.buttonMax,'yellow');

        var content = '('+lang.modalSendTxFee.replace('%fee%',assets.fees[asset].replace(/0+$/, '')).replace('%symbol%',asset.split('.')[0].toUpperCase())+')';
        var h = parseInt(content.length*0.5)+1;
        UI.text['Modalfield-3'] = blessed.text({
          parent: UI.modal.box,
          left: '50%-'+h,top: offset+(screen.height>16?'+6':'+5'),tags:true,shrink:true,align: 'center',
          content: content,
          style: { fg: 'white', bg: 'black' }  
        });
        var content = lang.modalSendTxFrom.replace('%from%',((lang.modalSendTxFrom.length+assets.addr[asset].length)>(screen.width*0.5)?'\n':'')+assets.addr[asset]);
        var h = parseInt((screen.width<80?assets.addr[asset].length:content.length)*0.5)+1;
        UI.text['Modalfield-4'] = blessed.text({
          parent: UI.modal.box,
          left: '50%-'+h,top: offset+(screen.height>16?'+8':'+6'),tags:true,shrink:true,align: 'center',
          content: content,
          style: { fg: 'white', bg: 'black' }  
        });
                    
        UI.edit['SendTx'] = UI.buttonfunc.make('SendTx',UI.modal.box,-2,-1,lang.buttonSendTx,'blue');
        UI.edit['Cancel'] = UI.buttonfunc.make('Cancel',UI.modal.box,0-(lang.buttonCancel.length+lang.buttonSendTx.length),-1,lang.buttonCancel,'#400040');

        UI.edit['Max'].on('press', function() {
          UI.edit['Amount'].setValue(String(this.spendable));
          screen.render();
        }.bind({spendable:spendable}));
      
        UI.edit['Cancel'].on('press', function() {
          if(typeof UI.spinner.text['SendTx']=='undefined') {
            UI.modalfunc.destroy();
          }
        });
        
        UI.edit['SendTx'].on('press', function() {
          // is TX being sent?
          if(typeof UI.spinner.text['SendTx']=='undefined') {
            // send transaction
            sendTransaction({
              element:UI.text['AssetsA-'+asset],
              asset:asset,
              amount:UI.edit['Amount'].getValue(),
              source:assets.addr[asset],
              target:UI.edit['Target'].getValue()
            });
          }
        });
        
        UI.buttonfunc.init({'box':['Target','Amount','Max','Cancel','SendTx']},[1,1]);              
      } else {
        UI.modalfunc.alert(lang.modalSendTxTitle,lang.modalSendTxImpossible);
      }
    }.bind({i:i,balance:balance}));

    UI.edit.box.push('Recv'+i);
    UI.edit['Recv'+i] = UI.buttonfunc.make(lang.buttonRecv,UI.box,-5-lang.buttonAdv.length,y,0,'cyan');
    UI.edit['Recv'+i].on('press', function() {
    
      var asset = this.balance.asset[this.i];
      UI.modalfunc.make(lang.modalRecvTxTitle,(screen.height>12?'\n':'')+lang.modalRecvTxText.replace('%symbol%',asset.toUpperCase()));

      var h = parseInt(assets.addr[asset].length*0.5)+1;
      UI.text['Modalfield'] = blessed.text({
        parent: UI.modal.box,
        left: '50%-'+h,
        top: '50%-2',
        tags: true,shrink:true,align: 'center',
        content: assets.addr[asset],
        height: 2, style: { fg: 'white', bg: 'black' }
      });
    
      UI.edit['Copy'] = UI.buttonfunc.make('Copy',UI.modal.box,'center','50%',lang.buttonCopyClip,'yellow');
      UI.edit['Close'] = UI.buttonfunc.make('Close',UI.modal.box,-2,-1,lang.buttonClose,'#800080');

      UI.edit['Copy'].on('press', function() {
        clipboardy.write(this.address);
        for(var j=-5; j<=this.address.length+3; j=j+2) {
          setTimeout(function(){
            if(this.j<=this.address.length) {
              UI.text['Modalfield'].setContent(
              '{blue-fg}'+this.address.substr(0,this.j)+'{/blue-fg}{bold}{yellow-fg}'+
              this.address.substr(this.j,3)+
              '{/yellow-fg}{/bold}{blue-fg}'+this.address.substr(this.j+3,this.address.length-this.j+3)+'{/blue-fg}');
            } else {
              setTimeout(function(){
                UI.text['Modalfield'].setContent(this.address);
                screen.render();
              }.bind({address:this.address}),150);
            }
            screen.render();
          }.bind({j:j,address:this.address}),20*j);
        }
      }.bind({address:assets.addr[asset]}));

      UI.edit['Close'].on('press', function() {
        UI.modalfunc.destroy();
      });

      UI.buttonfunc.init({'box':['Copy','Close']},[1,1]);
    }.bind({i:i,balance:balance}));

    UI.edit.box.push('Adv'+i);
    UI.edit['Adv'+i] = UI.buttonfunc.make(lang.buttonAdv,UI.box,-2,y,0,'yellow');
    UI.edit['Adv'+i].on('press', function() {
      //UI.box.setContent('Advanced '+this.balance.asset[this.i]+' function stub.');
      UI.modalfunc.alert(lang.modalAdvTitle,lang.modalAdvText);
      screen.render();
    }.bind({i:i,balance:balance}));
    
    i++;
  }
}