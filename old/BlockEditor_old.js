////BlockEditor v.1.01 created by Walek
BlockEditor = function(options){
        //set options
        var def_options = {
            canvas: 'canvas_dahs',
            wsUri: '127.0.01'
        };
        options.__proto__ = def_options;
        this.options = options;
        
        this.cnv = null;
        this.ctx = null;
        this.ws  = null;
        
        this.Matrix = [];
        this.action = '';
        this.ctxOpts = {x: 0,y: 0, scale: 1};     //base options
        this.pos = {x:0,y:0};
        this.blockList = [];    //list blocks id's
        this.relationList = []; //list relations id's
//        this.relations = [];  
        this.wsType = '';       //wait this server response 
        this.MatrixReset = true;
        this.lineCreate = {out:{node:null,port:null},input:{node:null,port:null},type:null}
        this.loadNum = 0;
        this.hovered = null;
        this.d_d = false;
        this.fieldSelect = {};
        this.menuLib = null;
        
        this.blocks = {
            block: {},
            relation: {},
            // [{
            // f:,
            // t:, 
            // ports:[
            // inp:[],
            // out:[],
            // ]
            // }]
            rels: {},
            group: {},
            first: null,
            last: null
        }
        
    //save form
    this.saveForm = function(o){
        s = '{"cmd":"SaveWebForm", "WebForm":'+JSON.stringify(o)+'}';
        console.log('--------------------------',s);
        this.ws.send(s);
    }
    //initialize - get canvas, context, websocket
    this.init = function(){
        me = this;
        this.cnv = document.getElementById(options.canvas);
        this.cnv.width = 1500;
        this.cnv.height = 800;
        this.Matrix = new Array(this.cnv.height);
        for(var i=this.Matrix.length-1;i-->=0;){this.Matrix[i]=new Array(this.cnv.width);}
        
        this.ctx = this.cnv.getContext('2d');
//        this.ws2  = new WebSocket('ws://'+this.options.wsUri+':1234'); //need optimisation = start after show
//                    this.ws2.onmessage = function (e) {console.log(e);}
                    
        this.ws  = new WebSocket('ws://'+this.options.wsUri+':1235'); //need optimisation = start after show
                    this.ws.onopen = function (e) {
                        console.log("CONNECTED");
                        
                        this.send('{"jsonrpc": "2.0", "method": "SetScript", "params":{"path": "WebForm.and"}, "id": "1"}');
//                        this.send('{{"jsonrpc": "2.0", "method": "SetScript", "params":{"path": "WebForm.json"}, "id": "1"}}')
//                        this.send('{"cmd": "DeleteLibrary","name":"Web Form"}');
//                        this.send('{"cmd": "LoadLibrary", "path" : "WebForm.json"}');
                        this.send('{"cmd": "GetLibrariesTree"}');
                        me.vsType = 'getLibrariesTree';
//                        me.vsType = 'getBlocks';
//                        this.send('{"cmd": "GetNodeIDs", "logicID": 1}');
                    };
                    this.ws.onclose = function (e) {
                        me.ctx.clearRect(-me.ctxOpts.x,-me.ctxOpts.y,me.cnv.width/me.ctxOpts.scale,me.cnv.height/me.ctxOpts.scale);
                        me.ctx.fillText('Disconnected',20,20);
                        me.ctx.fillStyle='red';
                        me.Matrix = [];
                        console.log("DISCONNECTED");
                    };
                    this.ws.onmessage = function (e) {
                        switch (me.vsType){
                               case 'getLibrariesTree':
                                    var o = JSON.parse(e.data);
                                    console.log(o);
                                    me.menuLib = o;
                                    me.buildMenuLib();
                                    me.vsType = 'getBlocks';
                                    this.send('{"cmd": "GetNodeIDs", "logicID": 1}');
                                    break;
                               case 'getBlocks':
                                    me.blockList = JSON.parse(e.data);
                                    me.vsType = 'getBlock';
                                    for(var i = 0;i<me.blockList.length;i++){
                                        s = JSON.stringify({"cmd": "GetNode", "id": me.blockList[i].id});
                                        this.send(s);
                                    }
                                    break;
                                case 'getBlock':
                                    var b = JSON.parse(e.data);
                                    me.addBlock(b);
                                    me.loader('Р—Р°РіСЂСѓР·РєР° Р±Р»РѕРєРѕРІ',me.blockList.length);
                                    if(b.Description.id==me.blockList[me.blockList.length-1].id){
                                        me.vsType = 'getRelations';
                                        me.loadNum = 0;
                                        this.send('{"cmd": "GetLinkIDs", "logicID": 1}');
                                    }
                                    delete b;
                                    break;
                                case 'getRelations':
                                    me.relationList = JSON.parse(e.data);
                                    me.vsType = 'getRelation';
                                    for(var i=0;i<me.relationList.length;i++){
                                        s = JSON.stringify({"cmd": "GetLink", "id": me.relationList[i].id});
                                        this.send(s);
                                    }
                                    break;
                                case 'getRelation':
                                    b = JSON.parse(e.data);
                                    me.addRelation(b);
                                    me.loader('Р—Р°РіСЂСѓР·РєР° СЃРІСЏР·РµР№',me.relationList.length);
                                    if(b.Description.id==me.relationList[me.relationList.length-1].id){
                                        me.vsType = '';
                                        me.draw();
                                    }
                                    delete b;
                                    break;
                                case 'createBlock':
                                    var r=JSON.parse(JSON.stringify(e.data));
                                    console.log(e);
                                    me.vsType = 'getBlock';
//                                    s = JSON.stringify({"cmd": "GetNode", "id": r.nodeIDs[0]});
//tmp                                    
                                    me.vsType = 'getBlocks';
                                    this.send('{"cmd": "GetNodeIDs", "logicID": 1}');
                                    this.send(s);
//                                    me.draw();
//endtmp
                                    break;
                                default:
//                                    var r=JSON.parse(e.data);//JSON.parse(JSON.stringify(e.data));
                                    var r=JSON.parse(JSON.stringify(e.data));
                                    console.log('message:',r);
//                                    if(r.result='changed'){me.init();}
                        }
                    }
                    this.ws.onerror = function (e) {
                        me.ctx.fillText('Error on connect',20,10);
                        me.ctx.fillStyle='red';
                        console.log('ERROR: ',e);
                    };
                    
                    this.cnv.onmousedown = function(e){
                        me.mousedown(e);
                        return false;
                    }
                    
                    this.cnv.onmouseup = function(e){
                        me.mouseup(e);
                        return false;
                    }
                    this.cnv.oncontextmenu = function(e){
                        me.menu(e);
                        return false;
                    }
                    this.cnv.onmousemove = function(e){
                        me.mousemove(e);
                        return false;
                    }
                    $(this.cnv).mousewheel(function(e){
                        return false;
                        me.ctxOpts.scale = me.ctxOpts.scale*(1+e.deltaY/10);
                        me.ctxOpts.x/=me.ctxOpts.scale;
                        me.ctxOpts.y/=me.ctxOpts.scale;
                        s = 1+e.deltaY/10;
                        me.ctx.scale(s,s);
                        me.draw();
//                        s=1-me.ctxOpts.scale/10;
//                        me.ctx.scale(s,s);
//                        me.ctxOpts.scale += e.deltaY;
//                        s=1-me.ctxOpts.scale/10;
//                        me.ctx.scale(s,s);
//                        me.draw();
//                        console.log(me.ctxOpts.scale);
                        return false;
                    });
    }
    
    //addBlock
    //o - json object
    this.addBlock = function(o){
        var a = this.blocks;
        var b = o.Description;
        if(b.groupID>0){
            var go = {};
            go[b.id]=true;
            if (a.group[b.groupID]===undefined){a.group[b.groupID]={}}
            a.group[b.groupID][b.id]=true;
        }
        a.block[b.id]=o;
        if (a.first===null) {
            a.first = b.id;
        }
        if (a.last!==null){
            a.rels[a.last].t = b.id;
        }
        a.rels[b.id] = {f: a.last, t: null, ports: []}//{input:[],output:[]}}
//        for(i in b.inputPorts){a.rels[b.id].ports.input[i]=[];}
//        for(i in b.outPorts){a.rels[b.id].ports.output[i]=[];}
        a.last = b.id;
        delete a;
        delete b;
    }
    
    //addRelation
    //o - json object
    this.addRelation = function(o){
        var a = this.blocks;
        var r = o.Description;
        a.relation[r.id]=o;
        a.relation[r.id].wait=false;
        
        a.rels[r.sourcePoint.nodeID].ports.push(r.id);
        a.rels[r.destinationPoint.nodeID].ports.push(r.id);
//        a.rels[r.sourcePoint.nodeID].ports.output[r.sourcePoint.portIndex].push(r.id);
//        a.rels[r.destinationPoint.nodeID].ports.input[r.destinationPoint.portIndex].push(r.id);
        
        
        delete a;
        delete r;
    }
    //mousedown function
    this.mousedown = function(e){
                        this.pos.x=e.layerX;
                        this.pos.y=e.layerY;
                        if(e.button==2){
                            this.action = 'moveContext';
                        }
                        else if(e.button==0){
//                            console.log('x:',e.layerX,' y:',e.layerY,me.Matrix[e.layerY][e.layerX]);
                            if (this.Matrix[e.layerY][e.layerX]!==undefined){
//                                me.pos.x=e.layerX;
//                                me.pos.y=e.layerY;
                                var n = me.Matrix[e.layerY][e.layerX];
                                //block or line
                                if(this.blocks.block[n]!==undefined){
                                    var bl=this.blocks.block[n].Description; 
                                    var x = e.layerX-bl.posX-this.ctxOpts.x;
                                    var y = e.layerY-bl.posY-this.ctxOpts.y;
                                    var lv = Math.floor(y/20);
                                    if(lv>0){
                                      this.action='lineDraw';
                                        if(Math.floor(x/100)>0){
                                            if(bl.outPorts[lv-1]!==undefined){
                                                this.lineCreate.out = {node: n,port:lv-1}
                                                this.lineCreate.type='out';
                                            }
                                        }else{
                                            if(bl.inputPorts[lv-1]!==undefined){
                                                this.lineCreate.input = {node: n,port:lv-1}
                                                this.lineCreate.type='input';
                                            }
                                        }
//                                      this.lineCreate = {block: n,type:type,port: lv-1} //С…СЂРµРЅСЊ?
                                    }
                                    else{
                                        me.action = 'moveBlock';
                                    }
                                    
                                }else{
                                }
                                    me.selection(n);
                            }
                            else {
                                this.selection(undefined);
                                this.draw();
                                this.action='selectField'
                            }
//                            me.action='moveBlock';
//                            var pixel = me.ctx.getImageData(e.layerX,e.layerY,1,1).data;
//                            console.log(pixel,' ',e.layerX,' ',e.layerY);
//console.log(me.ctx.bezierCurveTo);
                        }
        
    }
    
    //mousemove function
    this.mousemove = function(e){
                        var m = document.getElementById('context_menu');
                        if(m!==null){m.remove();}
                        x=e.layerX-this.pos.x;
                        y=e.layerY-this.pos.y;
                        switch(this.action){
                            case 'moveContext':
                                var speed = 1; //speed moving context - disabled
                                
                                this.ctx.translate(-this.ctxOpts.x,-this.ctxOpts.y);
                                this.ctxOpts.x+=x/this.ctxOpts.scale;
                                this.ctxOpts.y+=y/this.ctxOpts.scale;
                                this.pos = {x:e.layerX,y:e.layerY};
                                this.ctx.translate(this.ctxOpts.x,this.ctxOpts.y);
                                this.draw();
                                break;
                            case 'moveBlock':
                                var bl = this.blocks.block[this.select].Description;
//                                this.ctxOpts.x+=x/this.ctxOpts.scale;
//                                this.ctxOpts.y+=y/this.ctxOpts.scale;
                                bl.posX+=x;
                                bl.posY+=y;
                                this.pos = {x:e.layerX,y:e.layerY};
                                this.draw();
                                break;
                            case 'selectField':
                                this.draw();
                                this.ctx.beginPath();
                                this.ctx.fillStyle = 'rgba(62,131,168,0.5)';//this.rgb({r:62,g:131,b:168});
                                this.ctx.fillRect(this.pos.x-this.ctxOpts.x,this.pos.y-this.ctxOpts.y,e.layerX-this.pos.x,e.layerY-this.pos.y);
                                this.ctx.closePath();
                                break;
                            case 'lineDraw':
                                this.draw();
                                var n = this.lineCreate[this.lineCreate.type].node;
                                var bl = this.blocks.block[n].Description;
                                var blp = bl[this.lineCreate.type+'Ports'][this.lineCreate[this.lineCreate.type].port];
//                                var blp = (this.lineCreate.type=='out')?this.blocks.block[this.lineStart.block].Description.outPorts[this.lineStart.port]:this.blocks.block[this.lineStart.block].Description.inputPorts[this.lineStart.port];
                                var dop = (this.lineCreate.type=='out')?100:-100;
                                var p = {
                                 x1: blp.connectionX+bl.posX, 
                                 y1: blp.connectionY+bl.posY,
                                 x2: blp.connectionX+bl.posX+dop,   
                                 y2: blp.connectionY+bl.posY,
                                 x3: e.layerX-dop-this.ctxOpts.x,
                                 y3: e.layerY-this.ctxOpts.y,
                                 x4: e.layerX-this.ctxOpts.x,
                                 y4: e.layerY-this.ctxOpts.y,
                                }
                                this.ctx.beginPath();
                                this.ctx.strokeStyle = 'yellow';
                                if (this.Matrix[e.layerY][e.layerX]!==undefined){
                                    if(this.blocks.block[this.Matrix[e.layerY][e.layerX]]!==undefined){
                                        var tbl = this.blocks.block[this.Matrix[e.layerY][e.layerX]].Description;
                                        var port = Math.floor((e.layerY-(tbl.posY+this.ctxOpts.y))/20);
                                        if(
                                                port>0&&
                                                ((Math.floor((e.layerX-(tbl.posX+this.ctxOpts.x))/100)==0&&this.lineCreate.type=='out'&&tbl.inputPorts[port-1]!==undefined)||  //govno. peredelat
                                                (Math.floor((e.layerX-(tbl.posX+this.ctxOpts.x))/100)==1&&this.lineCreate.type=='input'&&tbl.outPorts[port-1]!==undefined))
                                            )
                                        {
                                            this.ctx.strokeStyle = 'green';
                                            this.lineAdd = {node:tbl.id,port:port-1}
                                        }else{this.lineAdd=null;}
                                    }else{
                                        
                                    }
                                }
                                this.ctx.moveTo(p.x1,p.y1);
                                this.ctx.lineWidth = 3;
                                this.ctx.lineJoin = 'circle';
                                this.ctx.bezierCurveTo(p.x2,p.y2,p.x3,p.y3,p.x4,p.y4);
                                var arrow = {}
                                if(this.lineCreate.type=='input'){arrow={x:p.x1,y:p.y1}}else{arrow={x:p.x4,y:p.y4}}
                                this.ctx.moveTo(arrow.x,arrow.y);
                                this.ctx.lineTo(arrow.x-5,arrow.y-2);
                                this.ctx.lineTo(arrow.x-4,arrow.y);
                                this.ctx.lineTo(arrow.x-5,arrow.y+2);
                                this.ctx.lineTo(arrow.x,arrow.y);
                                
//                                this.ctx.lineTo(p.x4-7,p.y4-3);
//                                this.ctx.lineTo(p.x4-4,p.y4);
//                                this.ctx.lineTo(p.x4-7,p.y4+3);
//                                this.ctx.lineTo(p.x4,p.y4);
                                this.ctx.stroke();
                                this.ctx.closePath();
                                break;
                            default:
//                                c = this.ctx.getImageData(e.layerX,e.layerY,1,1).data;
//                                console.log(this.Matrix[e.layerY][e.layerX]);
                                if(this.Matrix[e.layerY][e.layerX]!==undefined){
                                    if(this.hovered==null||this.hovered!=this.Matrix[e.layerY][e.layerX]){
//                                        this.hover(this.Matrix[e.layerY][e.layerX]);
                                        this.hovered = this.Matrix[e.layerY][e.layerX];
                                        this.draw();
                                    }
                                }else{
                                    if(this.hovered!==null){
                                        this.hovered=null;
                                        this.draw();
                                    }
                                }
                        }
    }
    
    //mouse up function
    this.mouseup = function(e){
                        switch(this.action){
                            case 'moveContext':
//                                this.action = '';
                                this.MatrixReset = true;
                                this.draw();
                                break;
                            case 'moveBlock':
                                this.ws.send('{"cmd": "MoveFinished", "id": '+this.select+', "posX": '+this.blocks.block[this.select].Description.posX+', "posY": '+this.blocks.block[this.select].Description.posY+'}');
                                this.MatrixReset = true;
                                this.draw();
                                break;
                            case 'lineDraw':
                                if(this.lineAdd!==null){
                                    var r = this.blocks.relation[this.relationList[0].id];
                                    if(this.lineCreate.type=='out'){this.lineCreate.input=this.lineAdd;}
                                    else{this.lineCreate.out=this.lineAdd;}
                                    r = JSON.parse(JSON.stringify(r));
                                    console.log(Object.keys(this.blocks.relation).length);
                                    r.Description.id = Object.keys(this.blocks.relation).length;//r.Description.id+1;
                                    r.Description.sourcePoint.nodeID = this.lineCreate.out.node;
                                    r.Description.sourcePoint.portIndex = this.lineCreate.out.port;
                                    r.Description.destinationPoint.nodeID = this.lineCreate.input.node;
                                    r.Description.destinationPoint.portIndex = this.lineCreate.input.port;
                                    //zaglushka
//                                    {"cmd": "CreateLinks", "Links": [{"Description": {"destinationPoint": {"color":{},"nodeID": 38,"portIndex": 0},"sourcePoint": {"color": {},"nodeID": 39,"portIndex": 0}}}]}

                                    this.addRelation(r);
                                    this.draw();
                                    this.lineCreate = {};
                                    this.lineAdd = {};
                                }
                                break;
                            case 'selectField':
                                var n = null;
                                if(this.fieldSelect!==undefined){
                                    for(i in this.fieldSelect){
                                        this.blocks.block[i].selected=false;
                                    }
                                    this.fieldSelect = {}
                                }
                                for(var i=e.layerY;i-->this.pos.y;){
                                    for(var j=e.layerX;j-->this.pos.x;){
                                        if(this.Matrix[i][j]!==undefined&&n!=this.Matrix[i][j]&&this.blocks.block[this.Matrix[i][j]]!==undefined){
                                            n=this.Matrix[i][j];
                                            this.blocks.block[n].selected=true;
                                            this.fieldSelect[n]=true;;

                                        }
                                    }
                                }
//                                console.dir(ar);
                                this.draw();
                                break;
                        }
                        this.action = '';
                        if(this.d_d){
                            var nb = JSON.parse(JSON.stringify(this.blocks.block[this.d_d]));
                            nb.Description.id= Object.keys(this.blocks.block).length;
                            nb.Description.posX = e.layerX-this.ctxOpts.x;
                            nb.Description.posY = e.layerY-this.ctxOpts.y;
                            this.MatrixReset = true;
//                            this.addBlock(nb);
                            this.d_d = false;
                        }
        
    }
    //context menu function
    this.menu = function(e){
        var menu = document.createElement('div');
        menu.id = 'context_menu';
        if(this.fieldSelect){
            menu.innerHTML = '<div>Create group</div>\n\
                              <div>deselect</div>';
        }
//        menu.innerHTML = '\
//                <div>Create group</div>\n\
//                <div>Collapse group</div>\n\
//                <div>Expose group</div>\n\
//            ';
//        menu.style.position='absolute';
        menu.style.cssText = 'position: absolute;background-color: white;padding:5px;';
        menu.style.top=e.layerY-5+'px';
        menu.style.left=e.layerX-30+'px';
//        menu.onmouseover = function(e){console.log(this);}
//        menu.onmouseout = function(e){$(this).remove();}
        var a = menu.getElementsByTagName('div');
        for(var i = a.length;i-->0;){
            a[i].style.width='130px';
            a[i].style.paddingLeft='5px';
            a[i].style.cursor='pointer';
            a[i].onmouseover=function(){this.style.backgroundColor='lightgray';}
            a[i].onmouseout=function(){this.style.backgroundColor='white';}
            a[i].onclick = function(){me.menuAction(this.textContent);menu.remove();}
            a[i].oncontextmenu = function(){return false;}
        }
//                .foreach(function(i){
//        });
//        menu.style.backgroundColor='white';
//        menu.style.border = '1px solid';
        
        document.getElementById('BlockEditor').appendChild(menu);
//        console.log(menu.style);
        
    }
    this.menuAction = function(param){
        switch(param){
            case 'Create group':
                var o = this.blocks.group;
                o[Object.keys(o).length] = this.fieldSelect;
                //zaglushka
                //cmd: createGroup
                this.draw();
                break;
            default:
                console.log('errorr menu action');
        }
    }
    
    //bezier curves
    this.bezier = function(data){
            var plots = [];
            var t = 0.01;
            var x;var y;
            for (var ti=0;ti<1;ti+=t){
                x = (1-ti)*(1-ti)*(1-ti)*data.x1 + 3*(1-ti)*(1-ti)*ti*data.x2 + 3*(1-ti)*ti*ti*data.x3+ti*ti*ti*data.x4;
                y = (1-ti)*(1-ti)*(1-ti)*data.y1 + 3*(1-ti)*(1-ti)*ti*data.y2 + 3*(1-ti)*ti*ti*data.y3+ti*ti*ti*data.y4;
//                plots.push([Math.floor(x),Math.floor(y)]);
                plots.push([x,y]);
            }
            return plots;
        }
    
    this.newScript = function(){
        this.ws.send('{"cmd": "SetScript", "path": "perfect_script"}');
    }
    
    this.getRelations = function(n){
        var b = this.blocks.rels[n].ports;
        var r = b.input.concat(b.output);
//        r= r.concat(b.input).concat(b.output);
//        for(i in b.input){
//           if(b.input[i]!==null){r.push(b.input[i]);}
//        }
//        for(i in b.output){
//           if(b.output[i]!==null){r.push(b.output[i]);}
//        }
        delete b;
        return r;
    }

    //draw - drawing context function
    this.draw = function(){
        var scale = 1;//-this.ctxOpts.scale/10;
//        this.ctx.clearRect(0-this.pos.x-5,0-this.pos.y-5,this.cnv.width-this.pos.x+5,this.cnv.height-this.pos.y+5);
        this.ctx.clearRect(-this.ctxOpts.x,-this.ctxOpts.y,this.cnv.width/this.ctxOpts.scale,this.cnv.height/this.ctxOpts.scale);
//        this.ctxOpts.scale = 0.4;
//        this.ctxOpts = {x:800,y:400,scale: 0.6}
        
        
//        this.ctx.scale(this.ctxOpts.scale,this.ctxOpts.scale);
//        this.ctx.translate(this.ctxOpts.x,this.ctxOpts.y);
        if(this.MatrixReset){
            this.Matrix = new Array(this.cnv.height);
            var len = this.cnv.width;
            for(var i = this.Matrix.length-1;i-->=0;){
                this.Matrix[i]=new Array(len);
            }
//            for(var i = this.Matrix.length-1;i-->=0;){
//                for(var j = this.Matrix.length-1;j-->=0;){
//                    this.Matrix[i,j]=0;
//                }
//            }
        }
        this.grid(200);
        this.drawGroups();
        this.drawBloks();
//        if(this.MatrixReset){console.dir(this.Matrix);}
        this.MatrixReset = false;
    }

    this.drawBloks = function(){
        var a = this.blocks;
        var ctx = this.ctx;
        
        var cur = a.first;
        var b;
        do {
            this.drawBlockSequence(cur);
            cur = a.rels[cur].t;
        } while(cur!==null)
        
        delete a;
    }

    //drawBlockSequence - drawing single block with all opts
    //param n - number block
    this.drawBlockSequence = function(n){
        var o  = this.blocks.block[n];
        var ds = o.DrawingSequence;
        var first = true;
        opts = {pos: o.Description, pw: null, sc: null, sf: null};
        br = {x:o.Description.posX+this.ctxOpts.x,y:o.Description.posY+this.ctxOpts.y,w:ds[2].width,h:ds[2].height};
        
        if (
                this.MatrixReset &&
                br.x+br.w>0 && br.x<this.cnv.width &&
                br.y+br.h>0 && br.y<this.cnv.height
        ){
            xb = (br.x<0)?0:br.x;
            yb = (br.y<0)?0:br.y;
            xe = (br.x+br.w>this.cnv.width)?this.cnv.width:br.x+br.w;
            ye = (br.y+br.h>this.cnv.height)?this.cnv.height:br.y+br.h;
            for(var y=(br.y+br.h>this.cnv.height)?this.cnv.height-1:br.y+br.h-1;y-->=yb;){
                for(var x=(br.x+br.w>this.cnv.width)?this.cnv.width:br.x+br.w;x-->=xb;){
                        try{
                            this.Matrix[y][x]=n;
                        }catch(e){console.log(e,' err: ',x,' ',y,' h: ',o.Description.posY)}
//                    }
                }
            }
        }
            
        for(i=0;i<ds.length;i++){
//        for(i in ds){
            switch(ds[i].op_name){
                case 'setPenWidth': opts.pw=ds[i].width;break;
                case 'SetColor': opts.sc=ds[i];break;
                case 'fillRect':
                    this.ctx.beginPath();
                          if(this.hovered==n&&i==2){
                              this.ctx.fillStyle = 'yellow';
                          }else if(o.selected&&i==8){
                              this.ctx.fillStyle = 'black';
                          }else{
                              this.ctx.fillStyle = this.rgb(opts.sc);
                          }
//                          this.ctx.fillStyle = (this.blocks.rels[n].selected&&i==8)?'black':this.rgb(opts.sc);
                          this.ctx.fill();
                          this.ctx.lineWidth = o.pw;
                          this.ctx.fillRect(opts.pos.posX+ds[i].x,opts.pos.posY+ds[i].y,ds[i].width,ds[i].height);
                    this.ctx.closePath();
                    break;
                case 'setFont': opts.sf=ds[i];break;
                case 'drawText': 
                    this.ctx.beginPath();
                        this.ctx.fillStyle = this.rgb(opts.sc);//"rgba("+f.sc.r+", "+f.sc.g+", "+f.sc.b+", "+f.sc.alpha+")";
                        this.ctx.font = opts.sf.size+"px "+opts.sf.family;
                        if(first){txt=ds[i].text+'    id: '+o.Description.id;first=false;}else{txt=ds[i].text;}
                        this.ctx.fillText(txt,opts.pos.posX+ds[i].x,opts.pos.posY+ds[i].y+13);
                    this.ctx.closePath();
                    break;    
//                default: alert('Not found rules for this options!');    
            }
        }
        r = this.blocks.relation;
        var m = this.blocks.rels[n].ports;
        for(i=0;i<m.length;i++){
            if (r[m[i]]){
                if(r[m[i]].wait){
                    this.drawRelSequence(m[i]);
                }else{r[m[i]].wait=true;}
            }
        }
    }
    
    //drawRelSequence - drawing one relation with options
    this.drawRelSequence = function(n){
        //types relations
        var rel_type = 0;
        r = this.blocks.relation;//[n].Description;
        bout = this.blocks.block[r[n].Description.sourcePoint.nodeID].Description;//.outPorts[r.sourcePoint.portIndex];
        bin  = this.blocks.block[r[n].Description.destinationPoint.nodeID].Description;//.inputPorts[r.destinationPoint.portIndex];
        points = {
            x1: bout.posX+bout.outPorts[r[n].Description.sourcePoint.portIndex].connectionX,
            y1: bout.posY+bout.outPorts[r[n].Description.sourcePoint.portIndex].connectionY,
            x2: bout.posX+bout.outPorts[r[n].Description.sourcePoint.portIndex].connectionX+100,
            y2: bout.posY+bout.outPorts[r[n].Description.sourcePoint.portIndex].connectionY,
            x3: bin.posX+bin.inputPorts[r[n].Description.destinationPoint.portIndex].connectionX-100,
            y3: bin.posY+bin.inputPorts[r[n].Description.destinationPoint.portIndex].connectionY,
            x4: bin.posX+bin.inputPorts[r[n].Description.destinationPoint.portIndex].connectionX,
            y4: bin.posY+bin.inputPorts[r[n].Description.destinationPoint.portIndex].connectionY,
        }
//        console.log(points);
        var ctx = this.ctx;
        ctx.beginPath();
                ctx.lineWidth = (this.hovered==n)?5:3;
//ГРАДИЕНТ                
                var grad = this.ctx.createLinearGradient(points.x1,points.y1, points.x4,points.y4);
                grad.addColorStop(0.3,this.rgb(bout.outPorts[r[n].Description.sourcePoint.portIndex].color));
                grad.addColorStop(1,this.rgb(bin.inputPorts[r[n].Description.destinationPoint.portIndex].color));
                
                this.ctx.strokeStyle = grad;
                this.ctx.lineJoin = 'circle';
                if(r[n].selected){
                    this.ctx.setLineDash([6,2]);
                    this.ctx.strokeStyle=this.rgb({r:255,g:128,b:0});
                }
                var plots = this.bezier(points);
//                console.log(plots);
                ctx.moveTo(points.x4,points.y4);
                for(var pi=plots.length-1;pi-->0;){
                    ctx.lineTo(plots[pi][0],plots[pi][1]);
                    if(
                            this.MatrixReset &&
                            plots[pi][0]+this.ctxOpts.x>3 && plots[pi][0]+this.ctxOpts.x<this.cnv.width-3 &&
                            plots[pi][1]+this.ctxOpts.y>3 && plots[pi][1]+this.ctxOpts.y<this.cnv.height-3
                    ){
                        var sqxb = Math.floor(plots[pi][0])-2+this.ctxOpts.x;
                        var sqyb = Math.floor(plots[pi][1])-2+this.ctxOpts.y;
                        for(var psy=Math.floor(plots[pi][1])+2+this.ctxOpts.y;psy-->sqyb;){ //Р«Р Р РћР 
                            for(var psx=Math.floor(plots[pi][0])+2+this.ctxOpts.x;psx-->sqxb;){
                                try{this.Matrix[psy][psx]=n;}catch(e){console.log('err:',psy,' ',psx);}
                            }
                        }
                    }
                }
//                ctx.bezierCurveTo(points.x2,points.y2,points.x3,points.y3,points.x4,points.y4);
        switch (rel_type){
            case 0:
//                ctx.moveTo(points.x1,points.y1);
//                me.ctx.arc(points.x1,points.y1,2,0,Math.PI*2);
                ctx.moveTo(points.x4,points.y4);
                ctx.lineTo(points.x4-7,points.y4-2);
                ctx.lineTo(points.x4-6,points.y4);
                ctx.lineTo(points.x4-7,points.y4+2);
                ctx.lineTo(points.x4,points.y4);
                break;
        }
        ctx.stroke();
        ctx.fillStyle='black';
        ctx.fillText('id: '+n,points.x4-40,points.y4-5);
        this.ctx.setLineDash([]);
        ctx.closePath();
    }
    
    //drawGroups - function groups drawing
    this.drawGroups = function(){
        var g = this.blocks.group;
        var b = this.blocks.block;
        var ctx = this.ctx;
        for(var i in g){
            var x=y=w=h=null;
            for(var j in g[i]){
                x = (x>b[j].Description.posX||x===null)?b[j].Description.posX:x;
                y = (y>b[j].Description.posY||y===null)?b[j].Description.posY:y;
                w = (w<b[j].Description.posX+b[j].DrawingSequence[2].width||w===null)?b[j].Description.posX+b[j].DrawingSequence[2].width:w;
                h = (h<b[j].Description.posY+b[j].DrawingSequence[2].height||h===null)?b[j].Description.posY+b[j].DrawingSequence[2].height:h;
            }
            ctx.beginPath();
            ctx.rect(x-10,y-10,(w-x)+20,(h-y)+20);
            ctx.fillStyle = 'rgba(130,154,148,0.8)';
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle='black';
            ctx.fillText('id: '+i,x-8,y-1);
            if(this.MatrixReset){
//                console.log(w);
                var b=(h+10>0)?h+10:0;
                var e=(y-10>0)?y-10:0;
                for(var iy=b;iy-->e;){
                    var b=(w+10>0)?w+10:0;
                    var e=(x-10>0)?x-10:0;
                    for(var jx=b;jx-->e;){
//                        console.log('iy:',iy,' jx:',jx);
                        this.Matrix[iy][jx]=i;
                    }
                }
            }
        }    
    }
    
    //grid - draw context coords lines
    this.grid = function(size){
//        return false;
		size = (size || 200);//*this.ctxOpts.scale;
		var canv = this.cnv;
//                size*=this.ctxOpts.scale;
		var w = this.ctx.canvas.width/this.ctxOpts.scale, h = this.ctx.canvas.height/this.ctxOpts.scale;
		var count = Math.ceil(Math.max(w, h) / size);
		this.ctx.save();
		this.ctx.beginPath();
		do {
			var line = count * size;
			this.ctx.moveTo(line-this.ctxOpts.x, -this.ctxOpts.y);
			this.ctx.lineTo(line-this.ctxOpts.x, h-this.ctxOpts.y);
			this.ctx.moveTo(-this.ctxOpts.x, line-this.ctxOpts.y);
			this.ctx.lineTo(w-this.ctxOpts.x, line-this.ctxOpts.y);
		} while (count--);
		this.ctx.closePath();
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = this.rgb({r:137,g:143,b:153});//'rgb(137,143,153)';
		this.ctx.stroke();
		this.ctx.restore();
    }
    
    //key function
    this.keyup = function(k){
        switch(k.key){
               case 'Delete':
                   delete this.blocks.block.splice(this.select,1);
                   delete this.blocks.rels.splice(this.select,1);
                   this.select = false;
                   break;
        }
//        console.log(k.key);
    }
    //loader - load progress
    this.loader = function(s,l){
        this.loadNum++;
        var t = Math.round(this.loadNum*100/l);
        this.ctx.beginPath();
        this.ctx.clearRect(0,0,1000,800);
        this.ctx.moveTo(20,15);
        this.ctx.lineTo((t+20)*1.15,15);
        this.ctx.lineWidth=20;
        this.ctx.strokeStyle='red';
        this.ctx.stroke();
        this.ctx.fillText(s,40,20);
        this.ctx.closePath();
    }
    
    // webcolor<->rgb function
    //o - color object||string    
    this.rgb = function(o){
        try {
            if (typeof o === 'object'){
//                s='rgba('+o.r+', '+o.g+', '+o.b+', 0.86'+')';
                s='#';    
                ch = Number(o.r).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                ch = Number(o.g).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                ch = Number(o.b).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                return s;
            }else {
                //may be param value to string?
                c = {
                    r: parseInt(o.slice(1,2),16),
                    g: parseInt(o.slice(3,4),16),
                    b: parseInt(o.slice(5,6),16)
                };
                return c;
            }
        } catch (e){
            console.log('error: ',e);
        }
    }
    
    
    //selection ()

    this.selection = function(n){
        if (this.select!==undefined){
            if(this.blocks.block[this.select]!==undefined){
                this.blocks.block[this.select].selected = false;
            }else{
                this.blocks.relation[this.select].selected = false;
            }
        }
        if(this.blocks.block[n]!==undefined){
            this.blocks.block[n].selected = true;
            //set range 4 block
            if(me.blocks.last!=n){
                var bl = me.blocks.rels;
                if(bl[bl[n].f]!==undefined){bl[bl[n].f].t=bl[n].t;}else{this.blocks.first=bl[n].t;}
                bl[bl[n].t].f=bl[n].f;
                bl[me.blocks.last].t=n;
                bl[n].t=null;
                bl[n].f=me.blocks.last;
                me.blocks.last=n;
                me.draw();
            }
        }else if(this.blocks.relation[n]){
            this.blocks.relation[n].selected = true;
        }
        this.select = n;
        this.draw();
    }
    this.addSub = function(str){
        var sub = $('<div class="submenu">')
                .append($('<a/>',{class:'collapse-link'}).append('<div><i class="fa fa-list-alt"></i>'+str+'</div>'))
//                .append('<div class="submenu"/>');
        return sub;
    }

    this.buildMenuLib = function(){
        //code with jQuery :(
        console.log(this.menuLib);
        var menu = this.menuLib.sort(cmp1);
        $('#'+this.options.menuLib).empty();
        var menuHTML = $('#'+this.options.menuLib).append(this.addSub('Library'));
        var lst = $(".submenu",menuHTML);
//        $('.submenu',menuHTML).toggleClass('collapse');
        for(var im=this.menuLib.length;im-->0;){
            var l = this.addSub(this.menuLib[im].name);//$('<div class="submenu collapse"><i class="fa fa-list-alt"></i>'+this.menuLib[im].name+'</div>');
            $(lst).append(l);
            var obj = this.menuLib[im].definitions;
            obj.sort(cmp1);
            obj.sort(cmp2);
//            this.menuLib[im].definitions.sort(cmp1);
//            this.menuLib[im].definitions.sort(cmp2);
            var o = {};
            
//            lst = $(".submenu",l);
            for(var id=obj.length;id-->0;){
            l = $(lst).children('div.submenu:contains("'+this.menuLib[im].name+'")');
                var ar = obj[id].kind.split('/');
                for(var ik=0;ik<ar.length;ik++){
                    
                    if($(l).children('div.submenu:contains("'+ar[ik]+'")').length==0){
                        var elm = (ar[ik]=='')?$('<div class="submenu"></div>'):this.addSub(ar[ik]);
//                        var elm = this.addSub(ar[ik]);
                        $(l).append(elm);//.append('<div class="submenu"/>');
                    }
                    l = $(l).children('div:contains("'+ar[ik]+'")');
                }
                var el = $('<div class="drag2 ui-draggable ui-draggable-handle"  data-original-title="Click to add" data-toggle="tooltip" name="'+obj[id].name+'"  id="block_'+im+'_'+id+'"><i class="fa fa-puzzle-piece"></i>'+obj[id].name+'</div>');
                $(l).append(el);
//                console.log(el);
            }
        }
        
        $('#'+this.options.menuLib+'>div').toggleClass('collapse');
        $('#'+this.options.menuLib+' .submenu').toggleClass('collapse');
                $('#'+this.options.menuLib+' .drag2').draggable({
                    helper: 'clone',
                    start: function(event, ui) {
                        $('.left_col .scroll-view').css('overflow', '');
                        var el = angular.element(ui.helper[0]);
                        el.addClass('drag-act').css('color', 'black');
                        el.zIndex('1000');
                    },
                    stop: function() {
                        $('.left_col .scroll-view').css('overflow', 'hidden');
                    }
                });                
                $('#canvas_dahs').droppable({
                    accept: '.drag2',
                    drop: function(event, ui) {
                        var id = ui.draggable.attr('id'), ar_id = id.split('_');
//                        console.log(me.menuLib[ar_id[1]].definitions[ar_id[2]]);
//                            var addbl = JSON.parse(JSON.stringify(me.blocks.block[25]));
//                            console.log(event);
//                            console.log($('#canvas_dahs').offset());
//                            addbl.Description.id = Math.ceil(Math.random(200)*1000);
//                            addbl.Description.posX = event.clientX-off.left-100;
//                            addbl.Description.posY = Math.floor(event.clientY-off.top-30);
//                        me.addBlock(addbl);
                            var off = $('#canvas_dahs').offset();
                            off.top=event.clientY-off.top-me.ctxOpts.y;
                            off.left=event.clientX-off.left-100-me.ctxOpts.x;
                            console.log(off);
                            
//me.ws.send('{"cmd": "CreateNode", "name": "'+me.menuLib[ar_id[1]][2].name+'", "libraryName": "'+me.menuLib[ar_id[1]].name+'", "isContainer": 0, "posX": '+off.left+', "posY": '+off.top+'}');
me.vsType = 'createBlock';
me.ws.send('{"cmd": "CreateNode", "name": "'+me.menuLib[ar_id[1]].definitions[ar_id[2]].name+'", "libraryName": "'+me.menuLib[ar_id[1]].name+'", "isContainer": 0, "posX": '+Math.round(off.left)+', "posY": '+Math.round(off.top)+'}');
//console.log('{"cmd": "CreateNode", "name": "'+me.menuLib[ar_id[1]].definitions[ar_id[2]].name+'", "libraryName": "'+me.menuLib[ar_id[1]].name+'", "isContainer": 0, "posX": '+Math.round(off.left)+', "posY": '+Math.round(off.top)+'}');
//                        me.draw();
//                        var el = angular.element(ui.draggable[0]);
//                        $scope.htmlComplite(el.attr('data-constructor'), event);
                    }
                });
        $('#'+this.options.menuLib).append(menuHTML);
        
        $('#'+this.options.menuLib+' .collapse-link').click(function(){$('>div.submenu',$(this).parent()).toggleClass('collapse');$(this).parent().toggleClass('active');});
//        $('#'+this.options.menuLib+' .submenu').click(function(){$('>div',this).toggleClass('collapse');});
        
    }
    function cmp1(a,b){
        if (a.name.toUpperCase() < b.name.toUpperCase())
            return 1;
          else if (a.name.toUpperCase()> b.name.toUpperCase())
            return -1;
          else return 0;
    }
    function cmp2(a,b){
        if (a.kind.toUpperCase() < b.kind.toUpperCase())
            return 1;
          else if (a.name.toUpperCase()> b.name.toUpperCase())
            return -1;
          else return 0;
    }
    this.init();
};

