function extend(Child, Parent) {
	    var F = function() { }
	    F.prototype = Parent.prototype
	    Child.prototype = new F()
	    Child.prototype.constructor = Child
	    Child.superclass = Parent.prototype
	}
////JsonRPC class v.1.0. ©Created by Walek (barekku@yandex.ru) 2016
JsonRPC = function(parent, websocket, callback){
    var id = 0;
    RPC = this;
    readyState = false;
    var json = {
            jsonrpc: '2.0'
    }
    var historyController = function(){
            var wait = 3; //(in secs)
            console.log(history);
            var now = new Date().getTime()-wait*1000;
            for(var i in history){
                if (history[i].date<now){
                    var obj = {}
                    obj.method = history[i].method;
                    if (history[i].params){obj.params=history[i].params;}
                    RPC.send(obj);
                    delete history[i];
                }
            }
            setTimeout(historyController,1000);
    }
    var history = {}
    websocket.onopen = function(){
        setTimeout(function(){
            if(!readyState){console.log('bug, reconnect');}
        },5000);
//        setTimeout(historyController,1000);
//        callback();
    }
    websocket.onmessage = function(e){
//        console.log(e.data);
        if(e.data=='connection ready'){
            readyState = true;
            console.log('start');
            callback()
        };
        try {
            var obj = JSON.parse(e.data);
        }
        catch(ex){
            console.dir(ex);
        }
        if (obj!==undefined){RPC.processing(obj)}
    }
//    console.log(websocket);
    
    this.send = function(o){
        o.id = id++;
//        console.log('(send)id:',o.id,', obj:',o);
        $.extend( true, o, json );
//        console.log(o);
        history[o.id] = {method: o.method, params: o.params, date: new Date().getTime()}
//        history[o.id].method= o.method;//, date: new Date().getTime()}
        
//        console.log(JSON.stringify(o));
        websocket.send(JSON.stringify(o));
    }
    
    this.processing = function(o){
//        console.log('(proc)id:', o);
        if(o.result!==undefined){
            try{
                if (history[o.id]===undefined){console.log(history);}
                parent[history[o.id].method](o.result);
                delete history[o.id];
            }catch(ex){
                console.log('error:',ex);
            }
        }
    }
    
    this.result = function(o){
    }
}



////BlockEditor (with JQuery) v.2.00  ©Created by Walek (barekku@yandex.ru) 2016
BlockEditor = function(options){
        //set options
        var def_options = {
            canvas: 'canvas_dahs',
            wsUri: '127.0.0.1',
            width: 1500,
            height: 800
        };
        BE = this;
        $.extend( true, options, def_options);
        BE.options = options;
        BE.rpc = null;
//        BE.graph = null;
        BE.cnv = null;
        BE.ctx = null;
        BE.ws  = null;
        
        ctxOpts = {x: 0,y: 0, scale: 1};     //base options
        BE.fieldSelect = {};
        BE.Matrix = [];
        BE.menuLib = {};
        
        BE.blocks = {
            blockList: [],    //list blocks id's
            relationList: [], //list relations id's
            block: {},
            relation: {},
            rels: {},
            group: {},
            first: null,
            last: null
        }
        progress = {b:0,l:0}
        BE.init = function(){
//            console.log(BE);
//            BE.();
//            BE.rpc2 = new JsonRPC(new WebSocket('ws://'+options.wsUri+':1235'));
            BE.cnv = document.getElementById(options.canvas);
            $(BE.cnv).width('1500').height('800');
            BE.cnv.width = options.width;
            BE.cnv.height = options.height;
            BE.ctx = BE.cnv.getContext('2d');
            BE.graph = new EditorGraph(BE.cnv,BE.ctx,BE);
            BE.Matrix = new Array(options.width*options.height);
            BE.loader('Waiting...');
            BE.rpc = new JsonRPC(BE, new WebSocket('ws://'+options.wsUri+':48078'), function(){
                readScript();
            });
//            BE.rpc.send({method: "getNodeIDs"});
//            BE.rpc.send({method: "getLinkIDs"});
        }
        
//        this.action = '';
//        this.pos = {x:0,y:0};
//        this.MatrixReset = true;
//        this.lineCreate = {out:{node:null,port:null},input:{node:null,port:null},type:null}
//        this.loadNum = 0;
//        this.hovered = null;
        
var readScript = function(){
    var obj = {}
    BE.loader('Autorizing');
    obj = {method:'Login',"params":{"login":"b3n", "password":"123" },}
    BE.rpc.send(obj);
}
BE.CreateLinks = function(o){
    var obj = {};
    obj.Description = o.links[0];
    BE.GetLink(obj);
    BE.graph.draw();
}
BE.Login = function(){
    var obj = {}
    obj = {method:'GetNodeIDs'}
    BE.rpc.send(obj);
    obj = {method:'GetLinkIDs'}
    BE.rpc.send(obj);
    obj = {method:'GetLibrariesTree'}
    BE.rpc.send(obj);
}
BE.GetLibrariesTree = function(o){
//    console.log(o);
    BE.loader('Library loaded');
    var menu = {};
    var tmp;
    for(var i=o.length;i-->0;){
//        BE.menuLib[o[0].name]=o[0].definitions;
        menu[o[i].name]={}
        tmp = o[i].definitions;
//        console.log(tmp);
        for(var j = tmp.length;j-->0;){
            if (menu[o[i].name][tmp[j].kind]==undefined){menu[o[i].name][tmp[j].kind]=[]}
            var $el = $('<li/>').text(tmp[j].name);
            menu[o[i].name][tmp[j].kind].push($el);
//            console.log(tmp[j].kind);
        }
        console.log(menu);
    }
    for(i in menu){
        BE.menuLib = $('<ul/>').append($('<li/>').text(i));
        for(j in menu[i]){
            tmp = $('<ul/>').append($('<li/>').text(j)).append($('<li/>').append($('<ul/>').append(menu[i][j])));
            $(BE.menuLib).append(tmp);
        }
    }
    console.log(BE.menuLib);
    //createmenu
}
BE.GetNodeIDs = function(o){
    BE.blocks.blockList = o.ids;
    var obj = {}
    for(var i = 0;i<o.ids.length;i++){
        BE.graph.setBlock(o.ids[i]);
        obj = {method:'GetNode', params: {id: o.ids[i]}}
        BE.rpc.send(obj);
    }
}

BE.GetLinkIDs = function(o){
    BE.blocks.relationList = o.ids;
    var obj = {}
    for(var i = 0;i<o.ids.length;i++){
        obj = {method:'GetLink', params: {id: o.ids[i]}}
        BE.rpc.send(obj);
    }
}

BE.GetNode = function(o){
    var node = o;//.description;
    BE.blocks.block[node.id] = node;
    BE.graph.addBlock(o);
    progress.b++;
    var pr = Math.round(progress.b*100/BE.blocks.blockList.length);
    if(pr=100){progress.b=true}
    BE.loader('Loading nodes: '+pr+'%');
//    BE.blocks.block[node.id].draw = new Function("ctx", BE.graph.addBlock(o));
//    console.log(BE.blocks.block[node.id].draw);
//    console.log(node);
}
BE.GetLink = function(o){
//    console.log('link: ',o);
    var link = o.Description;
    BE.blocks.relation[link.id] = link;
    progress.l++;
    var pr = Math.round(progress.l*100/BE.blocks.relationList.length);
    if(pr=100){progress.l=true}
    BE.loader('Loading links: '+pr+'%');
//    BE.graph.addLine(o);
}
    
//BE.show = function(){
//    BE.graph.draw();
//}
BE.loader = function(txt){
//    if(progress.b==true&&progress.l==true){
//        BE.graph.draw('reset');
//    }else{
        BE.ctx.fillStyle = 'green';
        BE.ctx.font = '16px Arial';
        BE.ctx.clearRect(20,0,200,22);
        BE.ctx.fillText(txt,20,18);
//    }
}
        BE.init();
BE.load = function(){}
BE.save = function(){}
BE.show = function(){
    var obj = BE.blocks.block;

    menu = $('#'+options.menuLib);
    console.log(menu);
    for(i=0;i<10;i++){
        menu.append(BE.menuLib);
    }
    
    BE.graph.draw('reset');
    $(BE.cnv).on('mousemove',function(e){
        if (BE.taskable){
            BE.graph.ctxOpts.x -= (BE.pos.x-e.clientX)/BE.graph.ctxOpts.scale;
            BE.graph.ctxOpts.y -= (BE.pos.y-e.clientY)/BE.graph.ctxOpts.scale;
            BE.pos = {x:e.clientX,y:e.clientY}
            BE.graph.draw();
        }else{
            BE.graph.mousemove(e);
        }
    });
    $(BE.cnv).on('mousedown',function(e){
//        console.log(e);
        $(BE.cnv).focus();
        if (e.button==2||e.button==1){
            BE.taskable=true;
            BE.pos = {x:e.clientX,y:e.clientY}
        }
        BE.graph.mousedown(e);
        return false;
    });
    $(BE.cnv).on('mouseup',function(e){
        if(BE.taskable){
            BE.graph.draw('reset');
            BE.taskable = false;
        }
        BE.graph.mouseup(e);
    });
    $(BE.cnv).on('contextmenu',function(e){
        return false;
    });
//    $(BE.cnv).on('mousewheel',function(e){
////        console.log(BE.graph.ctxOpts.scale);
//        var scale = BE.graph.ctxOpts.scale * (1+e.deltaY*0.1);
//        if (scale>0.14&&scale<3){
//            BE.graph.ctxOpts.scale = scale;//*= 1+e.deltaY*0.1;
//            BE.graph.ctxOpts.x -= Math.round(e.deltaY*e.offsetX*0.1/BE.graph.ctxOpts.scale);
//            BE.graph.ctxOpts.y -= Math.round(e.deltaY*e.offsetY*0.1/BE.graph.ctxOpts.scale);
//            BE.ctx.scale(1+e.deltaY*0.1,1+e.deltaY*0.1);
//            BE.graph.draw('reset');
//        }
//        return false;
//    });
    $(BE.cnv).on('keydown',function(e){
        return false;
    });
    $(BE.cnv).on('keyup',function(e){
//        console.log(e.keyCode);
        switch(e.keyCode){
            case 38:
                BE.graph.ctxOpts.y -= 100;
                BE.graph.draw();
                return false;
                break;
            case 40:
                BE.graph.ctxOpts.y += 100;
                BE.graph.draw();
                return false;
                break;
            case 37:
                BE.graph.ctxOpts.x -= 100;
                BE.graph.draw();
                return false;
                break;
            case 39:
                BE.graph.ctxOpts.x += 100;
                BE.graph.draw();
                return false;
                break;
            case 82:
                if(e.ctrlKey){window.location.href='http://www.globexy.com/constructor'}
                break;
        }
//        console.log(e);
    });
    $(BE.cnv).on('focus',function(e){
//        console.log('focus: ',e);
    });
};
}
//    BE.rgb = function(o){
////        console.log(o);
//        try {
//            if (typeof o === 'object'){
////                s='rgba('+o.r+', '+o.g+', '+o.b+', 0.86'+')';
//                var s='#';    
//                ch = Number(o.r).toString(16);
//                s+= ch.length<2?'0'+ch:ch;
//                ch = Number(o.g).toString(16);
//                s+= ch.length<2?'0'+ch:ch;
//                ch = Number(o.b).toString(16);
//                s+= ch.length<2?'0'+ch:ch;
//                return s;
//            }else {
//                var c = {
//                    r: parseInt(o.slice(1,2),16),
//                    g: parseInt(o.slice(3,4),16),
//                    b: parseInt(o.slice(5,6),16)
//                };
//                return c;
//            }
//        } catch (e){
//            console.log('error: ',e);
//        }
//    }

//}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
