 EditorGraph = function(cnv, ctx, parent){
    EG = this;
    EG.progress = 'start';
    EG.ctx = ctx;
    var blocks = {blockList: {}, lineList: {}, first: null, last: null, block: {}, line: {}, hover:null,porthover:null, select:{}}
    var selecting = {}
    var Matrix = null;//new Array(cnv.height*cnv.width);
    var newLine = null;
    var Sequence = {
        height: 20,
        width: 100,
        title_color: 'blue',
        grid_color: {r:137,g:143,b:153},
        bg_color: {r:0,g:0,b:0},
        bg2_color: {r:255,g:255,b:248},
        bg3_color: {r:192,g:192,b:192},
//        port_color: {r:248,g:255,b:255}
        title_color: {b:127,g:0,r:0},
        title_text: {b:156,g:250,r:186},
        test_color: {b:65,g:65,r:65}
    }
    ctxOpts = {x: 0,y: 0, scale: 1}
    EG.ctxOpts = ctxOpts;
    
    this.setMatrix = function(o){
//        console.log('sm:',o);
        var maxX = null, maxY = null;
        var boundRect = [];
        var type = ['in','out','hover','select'];
        
        area = [o.description.inputPorts, o.description.outPorts,o.drawingSequence.hoveringZone, o.drawingSequence.selectionZone];
        for(var i =0;i<area.length;i++){
            for(var j=0;j<area[i].length;j++){
                var lines = {}//[];
                if (i<2){
                    var obj = area[i][j].rect;
                    var tmp_arr = [
                        {x:obj.x,y:obj.y},
                        {x:obj.x+obj.width,y:obj.y},
                        {x:obj.x+obj.width,y:obj.y+obj.height},
                        {x:obj.x,y:obj.y+obj.height}
                    ];
                }else{
                    var tmp_arr = area[i][j];
                }
                tmp_arr.push(tmp_arr[0]);
                for(var k=1;k<tmp_arr.length;k++){
                    var obj1 = tmp_arr[k-1];
                    var obj2 = tmp_arr[k];
                    maxX = Math.max(maxX,obj.x);
                    maxY = Math.max(maxY,obj.y);
                    
                    var x1=obj1.x,y1=obj1.y,x2=obj2.x,y2=obj2.y;
                    if (x2<x1){x2 = [x1, x1 = x2][0];}
                    if (y2<y1){y2 = [y1, y1 = y2][0];}
                    if(x1!=x2){
                        var angle=(y1!=y2)?(x2-x1)/(y2-y1):0;
                        var b=y1-angle*x1;
                        for(n=x1;n<=x2;n++){
                            var x = n;
                            var y = (angle*x+b);
                            if(lines[x]===undefined){lines[x]=[]}
                            lines[x].push(y);
                        }
                    }
//
                }
                boundRect.push({type: type[i],num: (i<2)?j:null, lines: lines});
            }
        }
//        console.log(boundRect);
//        console.log(maxX,' ',maxY);
        
        return {w:maxX,h:maxY,rect: boundRect};
    }
    EG.setBlock = function(id){
        blocks.blockList[id] = false;
        blocks.block[id] = {posX: null, posY: null, in: null, out: null}
        if (blocks.first == null){
            blocks.first = id;
        }else{
            blocks.block[id].prev = blocks.last,
            blocks.block[blocks.last].next = id;
        }
        blocks.last=id;
        blocks.block[id].next = null;
//        blocks.block[id].hover = undefined;
        blocks.block[id].lines = [];
        blocks.block[id].hoverMatrix = null;
        blocks.block[id].hoverMatrix = null;
        selecting[id]=false;
    }
    
    EG.addBlock = function(o){
        var func =  '';
        $(o.drawingSequence.graphics).each(function(i,d){
            func += '\n'+primitives[d.op_name](d);
        });
        func += 'ctx.closePath();';
        var bid = o.description.id;
        blocks.blockList[bid] = true;
//        console.log(blocks.blockList.length);
        
        blocks.block[bid].posX = o.description.posX;
        blocks.block[bid].posY = o.description.posY;
//        blocks.block[bid].id   = o.description.id;
        blocks.block[bid].in   = o.description.inputPorts;
        blocks.block[bid].out  = o.description.outPorts;

        blocks.block[bid].lines = [];
        blocks.block[bid].lineType = o.description.lineType;
        blocks.block[bid].draw = new Function("ctx",func);
        blocks.block[bid].bound = this.setMatrix(o);//o.drawingSequence.hoveringZone);
//        blocks.block[bid].selectMatrix = this.setMatrix(o.drawingSequence.selectionZone);
//console.log(blocks.block[bid]);
    }
    EG.addLine = function(o){
//        console.log(o);
        var ln = o.Description;
        blocks.line[ln.id]={bsid:ln.sourcePoint.nodeID,psid:ln.sourcePoint.portIndex,bdid:ln.destinationPoint.nodeID,pdid:ln.destinationPoint.portIndex}
        blocks.block[ln.sourcePoint.nodeID].lines.push(ln.id);
        blocks.block[ln.destinationPoint.nodeID].lines.push(ln.id);
        blocks.line[ln.id].points=lineType.create(ln.id,blocks.block[ln.destinationPoint.nodeID].lineType);
//        blocks.block[ln.sourcePoint.nodeID].lines.push(ln.id);
//        blocks.line[ln.id] = lineType[blocks.block[ln.sourcePoint.nodeID].lineType](ln.id);
        
//        console.log(ln);
//        blocks.block[ln.destinationPoint.nodeID].lines[ln.id]=ln.destinationPoint.portIndex;
//        blocks.block[ln.sourcePoint.nodeID].lines[ln.id]=ln.sourcePoint.portIndex;
//        blocks.line[ln.id] = lineType['Bezier'](ln.id);
//        blocks.block[ln.destinationPoint.nodeID].lines[].push(ln.id);
//        blocks.block[ln.sourcePoint.nodeID].lines.push(ln.id);
    }
    
    resetMatrix = function(){
        b = blocks.block;
        Matrix = new Array(cnv.width*cnv.height);
        for(i in b){
//            posX = Math.round((b[i].posX+ctxOpts.x));//*ctxOpts.scale);
//            posY = Math.round((b[i].posY+ctxOpts.y));//*ctxOpts.scale);
//console.log(b[i],' ',i);
            posX = b[i].posX+ctxOpts.x;
            posY = b[i].posY+ctxOpts.y;
            if ((posX+200)*ctxOpts.scale>=0&&posX<=cnv.width/ctxOpts.scale&&(posY+b[i].bound.h+20)*ctxOpts.scale>=0&&posY<=cnv.height/ctxOpts.scale){
//                ctx.beginPath();
//                ctx.fillStyle='rgba(100,0,100,0.5)';
//                ctx.fillRect(posX,posY,200,(b[i].bound.h+20));
//                ctx.closePath();
                var bx =  (posX*ctxOpts.scale<0)?0:posX*ctxOpts.scale,
                        ex = ((posX+200)*ctxOpts.scale<=cnv.width)?(posX+200)*ctxOpts.scale:cnv.width,
                        by = (posY*ctxOpts.scale<0)?0:posY*ctxOpts.scale,
                        ey = ((posY+b[i].bound.h+20)*ctxOpts.scale<cnv.height)?(posY+b[i].bound.h+20)*ctxOpts.scale:cnv.height;
                bx = Math.round(bx);
                ex = Math.round(ex);
                by = Math.round(by);
                ey = Math.round(ey);
                for(var yi=by;yi<=ey;yi++){
                    for(var xi=bx;xi<=ex;xi++){
//                        console.log(xi,' ',yi);
                        Matrix[yi*cnv.width+xi]=i;
                    }
                }
//    console.log(bx,' ',ex,' ',by,' ',ey);
            }
        }
//        console.log(Matrix);
    }
    EG.draw = function(attr){
//        console.log('??',selecting);
//        console.log(blocks);
//        console.log('draw exec');
//        if(EG.progress=='finally'){
            ctx.clearRect(0,0,cnv.width/ctxOpts.scale,cnv.height/ctxOpts.scale);
            grid(200);
            if(attr=='reset'){resetMatrix();}
            BlocksDraw();
//        }   
    }
    this.mousemove = function(e){
//        console.log(e.offsetX,' ',e.offsetY);
//            console.log(blocks.porthover);
        if (newLine!==null){
            this.draw();
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'red';
            ctx.moveTo(newLine.x,newLine.y);
            ctx.bezierCurveTo(newLine.x+100,newLine.y,e.offsetX-100,e.offsetY,e.offsetX,e.offsetY);
            ctx.stroke();
            ctx.closePath();
        }
        if (taskable!=false){
            sme = {x: -mPos.x+e.offsetX,y: -mPos.y+e.offsetY}
            mPos = {x: e.offsetX, y: e.offsetY}
            
            blocks.block[taskable].posX += Math.round(sme.x/ctxOpts.scale);
            blocks.block[taskable].posY += Math.round(sme.y/ctxOpts.scale);
            lnt = blocks.block[taskable].lines;
            for (i=lnt.length;i-->0;){
                blocks.line[lnt[i]].points = lineType.create(lnt[i],blocks.block[taskable].lineType);
            }
            this.draw();
        }else{
            num = {};
            var x = e.offsetX, y = e.offsetY;
            
            
            if(Matrix[y*cnv.width+x]!=blocks.hover){
                blocks.hover = Matrix[y*cnv.width+x];
//                console.log(blocks.block[blocks.hover]);
                EG.draw();
            }
            if (blocks.hover!==undefined&&blocks.hover!==null){
                var bx = x-(blocks.block[blocks.hover].posX+ctxOpts.x)*ctxOpts.scale,
                    by = y-(blocks.block[blocks.hover].posY+ctxOpts.y)*ctxOpts.scale;
                var bnd = blocks.block[blocks.hover].bound.rect;
                for (var i in bnd){
//                    console.log(bnd[i].lines);
                    if (bnd[i].lines[bx]!==undefined&&bnd[i].lines[bx][0]<by&&bnd[i].lines[bx][1]>by){
                        if (bnd[i].type=='in'||bnd[i].type=='out'){
                            var port = blocks.block[blocks.hover][bnd[i].type][bnd[i].num];
                            blocks.porthover = bnd[i];
                            var hx = (blocks.block[blocks.hover].posX+port.rect.x+ctxOpts.x)*ctxOpts.scale,
                                hy = (blocks.block[blocks.hover].posY+port.rect.y+ctxOpts.y)*ctxOpts.scale,
                                cx = (blocks.block[blocks.hover].posX+port.connectionX+ctxOpts.x)*ctxOpts.scale,
                                cy = (blocks.block[blocks.hover].posY+port.connectionY+ctxOpts.y)*ctxOpts.scale;
                            this.draw();
                            ctx.beginPath();
                            ctx.fillStyle = 'rgba('+port.color.r+','+port.color.g+','+port.color.b+',0.7)';
                            ctx.fillRect(hx,hy,port.rect.width*ctxOpts.scale,port.rect.height*ctxOpts.scale);
                            ctx.strokeStyle='green';
                            ctx.lineWidth = 3;
                            ctx.arc(cx,cy,3,0,2*Math.PI,true);
                            ctx.stroke();
                            ctx.closePath();
                        }else{blocks.porthover = null;}
                    }
                }
            }
        }
    }
    var taskable = false;
    this.mousedown = function(e){
//        console.log(
//        );
        if(blocks.porthover!==null&&blocks.porthover!==undefined){
//            var ln = o.Description;
//            ln={bsid:blocks.hover,psid:blocks.porthover,x2:e.offsetX,y2:e.offsetY}
//            newLine = lineType.create(ln,'Bezier',true);
//            this.draw();
//console.log(blocks.porthover);
                                var cx = (blocks.block[blocks.hover].posX+blocks.block[blocks.hover][blocks.porthover.type][blocks.porthover.num].connectionX+ctxOpts.x)*ctxOpts.scale,
                                cy = (blocks.block[blocks.hover].posY+blocks.block[blocks.hover][blocks.porthover.type][blocks.porthover.num].connectionY+ctxOpts.y)*ctxOpts.scale;
            newLine = {x:cx,y:cy, port: {block: blocks.hover,type: blocks.porthover.type, num: blocks.porthover.num}}
        }
        else if(blocks.hover){
//            blocks.block[blocks.hover].select = !blocks.block[blocks.hover].select;
            selecting[blocks.hover]=!selecting[blocks.hover];
            if (blocks.block[blocks.hover].next!=null){
                blocks.block[blocks.block[blocks.hover].prev].next=blocks.block[blocks.hover].next;
                blocks.block[blocks.block[blocks.hover].next].prev=blocks.block[blocks.hover].prev;
                blocks.block[blocks.last].next = blocks.hover;
                blocks.block[blocks.hover].next = null;
                blocks.block[blocks.hover].prev = blocks.last;
                blocks.last = blocks.hover;
            }
            taskable=blocks.hover;
            
            mPos = {x: e.offsetX, y: e.offsetY}
            this.draw();
        }
    }
    this.mouseup = function(o){
//        console.log(selecting);
        if (newLine!==null&&blocks.porthover!=null&&blocks.porthover!=undefined){
            console.log('ap', blocks.porthover, ' ', newLine);
//            if(blocks.porthover.type == 'out'){
//                if(newLine.port.type!='out'){
//                    console.log('create');
//                }
//            }else{
//                if(newLine.port.type!='in'){
//                    console.log('create');
//                }
//            }
//        var obj = {method: "CreateLinks", params:{links: [
//        {
//           sourcePoint: {nodeID: 39, portIndex: 0},
//           destinationPoint: {nodeID: 38, portIndex: 0}
//        }
//    ]}}
           var obj = {method: "CreateLinks", params:{links: [
        {
           destinationPoint: {nodeID: parseInt(blocks.hover), portIndex: blocks.porthover.num},
           sourcePoint: {nodeID: parseInt(newLine.port.block), portIndex: newLine.port.num}
        }
    ]}}
//    console.log(obj);
//    {
//                method
//            }
            parent.rpc.send(obj);
        }
        newLine=null;
        if(taskable){
            taskable=false;
            resetMatrix('reset');//!!
        }
    }
    var DrawLine = function(id){
        var ln = blocks.line[id];
        var lnp = blocks.line[id].points;
        
        var grad = ctx.createLinearGradient(lnp.x[0]+ctxOpts.x,lnp.y[0]+ctxOpts.y, lnp.x[lnp.x.length-1]+ctxOpts.x,lnp.y[lnp.y.length-1]+ctxOpts.y);
//        console.log('bsid: ',blocks.block[ln.bsid]);
        grad.addColorStop(0.3,rgb(blocks.block[ln.bsid].out[ln.psid].color));
        grad.addColorStop(1,rgb(blocks.block[ln.bdid].in[ln.pdid].color));
            ctx.beginPath();
            ctx.moveTo(lnp.x[0]+ctxOpts.x,lnp.y[0]+ctxOpts.y);
            for (var p = 1;p<lnp.x.length;p++){
                ctx.lineTo(lnp.x[p]+ctxOpts.x,lnp.y[p]+ctxOpts.y);
            }
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
    }
    var BlocksDraw = function(){
        var cur = blocks.first;
        var lns = {}
        do {
            blocks.block[cur].draw(ctx);
            ctx.fillStyle='red';
            ctx.fillText(cur,blocks.block[cur].posX+150+ctxOpts.x,blocks.block[cur].posY+18+ctxOpts.y);
            if(blocks.hover==cur){
                ctx.fillStyle = 'rgba(0,255,0,0.5)';
                ctx.fillRect(blocks.block[cur].posX+ctxOpts.x-1,blocks.block[cur].posY+ctxOpts.y,202,20);
            }
//            if(blocks.block[cur].select){
            if(selecting[cur]){
                ctx.fillStyle = 'rgba(0,100,255,0.5)';
                ctx.fillRect(blocks.block[cur].posX+ctxOpts.x+1,blocks.block[cur].posY+ctxOpts.y+1,200,20);
            }
            ln = blocks.block[cur].lines;
            for(i=ln.length;i-->0;){
                if(lns[ln[i]]===undefined){lns[ln[i]]=true}
                else{lns[ln[i]]=false;DrawLine(ln[i]);}
            }
            cur = blocks.block[cur].next;
        } while(cur!==null)
//            console.log(newLine);
    }
    var lineType = {
        create: function(id,type,flag){
            ln = blocks.line[id];
            if(flag){
                basePoints={
                    x1: 0,
                    y1: 0,
                    x2: id.x2,
                    y2: id.y2,
                }
            }else{
                basePoints={
                    x1: blocks.block[ln.bsid].out[ln.psid].connectionX+blocks.block[ln.bsid].posX,
                    y1: blocks.block[ln.bsid].out[ln.psid].connectionY+blocks.block[ln.bsid].posY,
                    x2: blocks.block[ln.bdid].in[ln.pdid].connectionX+blocks.block[ln.bdid].posX,
                    y2: blocks.block[ln.bdid].in[ln.pdid].connectionY+blocks.block[ln.bdid].posY,
                }
            }
            return lineType[type](basePoints);
        },
        Bezier: function(d){
            var plots = {x: [], y: []};
            data = {
                x1: d.x1,
                y1: d.y1,
                x2: d.x1+100,
                y2: d.y1,
                x3: d.x2-100,
                y3: d.y2,
                x4: d.x2,
                y4: d.y2
            }
            var t = 0.01;
            var x=null, y=null;
            for (var ti=0;ti<1;ti+=t){
                x = (1-ti)*(1-ti)*(1-ti)*data.x1 + 3*(1-ti)*(1-ti)*ti*data.x2 + 3*(1-ti)*ti*ti*data.x3+ti*ti*ti*data.x4;
                y = (1-ti)*(1-ti)*(1-ti)*data.y1 + 3*(1-ti)*(1-ti)*ti*data.y2 + 3*(1-ti)*ti*ti*data.y3+ti*ti*ti*data.y4;
    //                plots.push([Math.floor(x),Math.floor(y)]);
                plots.x.push(x);
                plots.y.push(y);
            }
            return plots;
        },
        line: function(d){
            var plots = {x: [d.x1,d.x2], y: [d.y1,d.y2]};
            
            return plots;
        },    
        polyLine: function(d){
            if (d.x1<d.x2){
                var plots = {x: [d.x1, d.x1+(Math.floor((d.x2-d.x1)/2)), d.x1+(Math.floor((d.x2-d.x1)/2)),d.x2], y: [d.y1,d.y1,d.y2,d.y2]};
            }else{
                var plots = {x: [d.x1, d.x1+100, d.x1+100, d.x2-100, d.x2-100, d.x2], y: [d.y1, d.y1, d.y1+Math.floor((d.y2-d.y1)/2), d.y1+Math.floor((d.y2-d.y1)/2), d.y2, d.y2]};
            }
            return plots;
        },    
    }
    grid = function(size){
//        return false;
		size = (size || 200);//*this.ctxOpts.scale;
		var count = Math.ceil(cnv.width/(size*ctxOpts.scale));
                var pnt = Math.floor(ctxOpts.x/size);
		ctx.save();
		ctx.beginPath();
                    do {
                        line = (count-pnt)*size;
			ctx.moveTo(0, line+ctxOpts.y);
			ctx.lineTo(cnv.width/ctxOpts.scale, line+ctxOpts.y);
			ctx.moveTo(ctxOpts.x+line, 0);
			ctx.lineTo(ctxOpts.x+line, cnv.height/ctxOpts.scale);
                    } while (count--);
		ctx.closePath();
		ctx.lineWidth = 4;
		ctx.strokeStyle = rgb(Sequence.grid_color);
		ctx.stroke();
		ctx.restore();
    }    
    
    // webcolor<->rgb function
    //o - color object||string    
    var rgb = function(o){
        try {
            if (typeof o === 'object'){
//                s='rgba('+o.r+', '+o.g+', '+o.b+', 0.86'+')';
                var s='#';    
                ch = Number(o.r).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                ch = Number(o.g).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                ch = Number(o.b).toString(16);
                s+= ch.length<2?'0'+ch:ch;
                return s;
            }else {
                var c = {
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
    EG.rgb = rgb;
    
    cnv.onclick = function(){
//        alert('nya');
    }
    //base primitives
    var primitives = {
        addHoverArea           : function(){},
        addSelectionArea       : function(){},
        drawEllipse            : function(o){
            var s = '';
//            var s ='var centerX = this.posX+600+Math.floor('+o.width+'/2);';
////            console.log(s);
//            s += 'var centerY = this.posY+200+Math.floor('+o.height+'/2);';
            s+= 'var radius = '+Math.ceil(o.height/2)+';';
            s+= 'if(fill){ctx.fillStyle = cl;}else{ctx.strokeStyle = cl;}';
            s+= '\
//ctx.beginPath();\n\
ctx.moveTo(this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+radius+'+o.y+');\n\
ctx.bezierCurveTo(\n\
this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+'+o.y+', \n\
this.posX+ctxOpts.x+'+o.x+'+'+o.width+', this.posY+ctxOpts.y+'+o.y+',\n\
this.posX+ctxOpts.x+'+o.x+'+'+o.width+', this.posY+ctxOpts.y+radius+'+o.y+');\n\
ctx.bezierCurveTo(\n\
this.posX+ctxOpts.x+'+o.x+'+'+o.width+', this.posY+ctxOpts.y+2*radius+'+o.y+',\n\
this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+2*radius+'+o.y+',\n\
this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+radius+'+o.y+'); \n\
//ctx.closePath();\n\
';
//ctx.bezierCurveTo(\n\
//this.posX+600, this.posY+200, \n\
//this.posX+600, this.posY+200+radius, \n\
//this.posX+800, this.posY+200+radius,\n\
//this.posX+800, this.posY+200);';
            s+= 'if(fill){ctx.fill();}else{ctx.stroke();}';
            
return s;
        },
        drawImage              : function(o){
var s = '\n\
    ctx.beginPath();\n\
    var image = new Image();\n\
    var th = this;\n\
    //image.onload = function()\n\
    //{\n\
    //}\n\
    image.src = "./img/'+o.image_name+'";\n\
    console.log(th.posX);\n\
    //while(image.width!=0){}\n\
    ctx.drawImage(image, th.posX+ctxOpts.x+'+o.x+', th.posY+ctxOpts.y+'+o.y+');\n\
';
return s;
    
        },
        drawLine               : function(o){
            var s= 'ctx.lineCap="round";ctx.moveTo(this.posX+600+'+o.x1+',this.posY+200+'+o.y1+');ctx.lineTo(this.posX+600+'+o.x2+',this.posY+200+'+o.y2+');ctx.stroke();ctx.closePath()';
            return s;
        },
        drawRoundedRect        : function(o){
            return 'ctx.strokeStyle=cl;ctx.rect( this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+'+o.y+', '+o.width+', '+o.height+');ctx.stroke();';
        },
        drawText               : function(o){
            return 'ctx.fillStyle=cl;ctx.fillText( "'+o.text+'", this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+11+'+o.y+');';
        },
        fillRect               : function(o){
//            return 'ctx.fillRect( this.posX+600+'+o.x+', this.posY+200'+o.y+', '+o.width+', '+o.height+');';

            return 'ctx.fillStyle=cl;ctx.fillRect( this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+'+o.y+', '+o.width+', '+o.height+');';
        },
        getInputColorR         : function(){},
        getInputColorG         : function(){},
        getInputColorB         : function(){},
        getInputName           : function(){},
        getInputCount          : function(){},
        getName                : function(){},
        getZoom                : function(){},
        Height                 : function(){},
        Width                  : function(){},
        isHovered              : function(){},
        isSelected             : function(){},
        isMovable              : function(){},
        setBoundingRect        : function(){},
        SetColor               : function(o){
          var s = 'ctx.beginPath();cl = "'+EG.rgb({r:o.r, g:o.g, b:o.b})+'";';
                  s+='fill = '+o.isSolidPattern+';';
                  s+= (o.isSolidPattern)?'ctx.fillStyle = cl;':'ctx.strokeStyle = cl;';
          return s;
          
        },
        setFont                : function(o){
            italic = (o.italic)?"italic ":"";
            return 'ctx.font = "'+italic+o.size+'px '+o.family+'";';
        },
        setPenWidth            : function(o){
            return 'ctx.lineWidth = '+o.width+';'
        },
        setInputBoundingRect   : function(){},
        setInputConnectionPort : function(){},
    }
    this.event = function(e){
        events[e.type](e);
    }
    var events = {
        mousedown: function(e){
            console.log('gclick');
        }
    }
}
