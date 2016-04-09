
;(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
//    root.BlockEditor = factory();
    window.BlockEditor = factory(); //kostil
  }

})(this, function() {
  var BlockEditor = {};
  var canvas = null;
  
  BlockEditor.version = '0.0.1';
  
  var blocks = {
      listNodes: null,
      listLinks: null,
      block: {
      },
      link: {},
      range: {
          first: null,
          last: null,
          block: {}
      }
  }
  BlockEditor.blocks = blocks;


    //callbacks
    var getNodes = function(o){
        blocks.listNodes = o.ids;
        loader.setEls(o.ids.length);
        
        blocks.range.first = o.ids[0];
        blocks.range.last = o.ids[o.ids.length-1];
        
        let obj = {
            method: 'GetNode',
            params: {
                id: null
            }
        }
        for(let i = o.ids.length;i-->0;){
            obj.params.id=o.ids[i];
            blocks.range.block[o.ids[i]] = {
                next: (o.ids[i+1])?o.ids[i+1]:null,
                prev: (o.ids[i-1])?o.ids[i-1]:null,
                lines: []
            }
            json(obj,addBlock);
        }
    }
    var getLinks = function(o){
        blocks.listNodes = o.ids;
        loader.setEls(o.ids.length);
        let obj = {
            method: 'GetLink',
            params: {
                id: null
            }
        }
        for(let i = o.ids.length;i-->0;){
            obj.params.id=o.ids[i];
            json(obj,addLink);
        }
    }
    var addBlock = function(o){
        blocks.block[o.description.id] = o;
//        console.log('node');
        loader.progress();
        if(loader.check()){graph.draw();events.addListeners(canvas);console.log(blocks.range);}
    }
    var addLink = function(o){
        blocks.link[o.Description.id] = o;
        blocks.range.block[o.Description.destinationPoint.nodeID].lines.push(o.Description.id);
        blocks.range.block[o.Description.sourcePoint.nodeID].lines.push(o.Description.id);
//        console.log('line: ',blocks.link[o.Description.id]);
        loader.progress();
        if(loader.check()){graph.draw();events.addListeners(canvas);console.log(blocks.range);}
    }
    var changeRange = function(num){
        if(num!=blocks.range.last){
            let br = blocks.range;
            br.block[br.block[num].prev].next = br.block[num].next;
            br.block[br.block[num].next].prev = br.block[num].prev;
            br.block[num].next = null;
            br.block[num].prev = br.last;
            br.block[br.last].next = num;
            br.last = num;
//            console.log(blocks.range);
        }
    }
    
  BlockEditor.start = function(opts) {
//      console.log('be start', main.service.jsonRPC, ' ', opts.canvas);
    canvas = opts.canvas;
    loader.set();
    graph.set(canvas);
    json({method:'GetNodeIDs'}, getNodes);
    json({method:'GetLinkIDs'}, getLinks);
//    json({method:'GetLibrary'}, getLinks);
//    let r = main.service.jsonRPC(obj);
//    console.log('flag: ', r);
        return this;
  };
  
  var json = function(o, callback){
    main.service.jsonRPC(o).then(
            result => {
//                console.log(result.result);
                callback(result.result);
            },
            error => {
                console.log("Error: " + error.message);
            }
    );
  }
  
  //loader
  var loader = {
      ready: false,
      els: null,
      setEls: function(num){
          this.els+=num;
      },
      progress: function(){
          this.els--;
//          console.log(this.els);
          this.ready = (this.els==0);
      },
      check: function(){
          return this.ready;
      },
      set: function(){
          this.els = 0;
      }
  }
  //graph
  var graph = {
      cnv: null,
      ctx: null,
      grid_color: {r:137,g:143,b:153},
      hover: false,
      portHover: false,
      newLine: {},
      select: {},
      size: {width: 960, height: 800},
      ctxOpts: {
          x: 0,
          y: 0,
          scale: 1
      },
      set: function(canvas){
        canvas.width = this.size.width;
        canvas.height = this.size.height;
        this.cnv = canvas;
        this.ctx = this.cnv.getContext('2d');
      },
      draw: function(){
          this.ctx.clearRect(0,0,this.size.width,this.size.height);
          this.ctx.save();
          this.ctx.translate(this.ctxOpts.x,this.ctxOpts.y);
          this.ctx.scale(this.ctxOpts.scale,this.ctxOpts.scale);
          this.grid(200);
          this.drawBlocks();
          this.ctx.restore();
      },
      grid: function(size){
                let ctx = this.ctx, cnv = this.cnv, ctxOpts = this.ctxOpts;
		size = (size || 200)*ctxOpts.scale;
                let startX = -(Math.floor((ctxOpts.x/ctxOpts.scale)/size)*size),//ctxOpts.x-Math.floor(ctxOpts.x/size),
                    startY = -(Math.floor((ctxOpts.y/ctxOpts.scale)/size)*size);
                
		ctx.save();
                ctx.beginPath();
//                for(let i = start;i<end;i+=size){
                for(let i = startX;i<(cnv.width-ctxOpts.x)/ctxOpts.scale;i+=200){
			ctx.moveTo(i,-ctxOpts.y/ctxOpts.scale);
			ctx.lineTo(i, (cnv.height-ctxOpts.y)/ctxOpts.scale);
                }
                for(let i = startY;i<(cnv.height-ctxOpts.y)/ctxOpts.scale;i+=200){
			ctx.moveTo(-ctxOpts.x/ctxOpts.scale,i);
			ctx.lineTo((cnv.width-ctxOpts.x)/ctxOpts.scale,i);
                }
		ctx.closePath();
		ctx.lineWidth = 3;
		ctx.strokeStyle = this.rgb(this.grid_color);
		ctx.stroke();
		ctx.restore();
      },
      drawBlocks: function(){
          let ctx = this.ctx;
          let b = blocks.block
          let i = blocks.range.first;
          let lines = {}
          do{
              let d = b[i].drawingSequence.graphics;
              ctx.beginPath();
              for(let draw in d){
                  d[draw].posX = b[i].description.posX;
                  d[draw].posY = b[i].description.posY;
                  this.primitives[d[draw].op_name](d[draw],ctx);
              }
              ctx.closePath();
              for(let l of blocks.range.block[i].lines){
                  if(lines[l]){
                      delete lines[l];
                      let linetype = b[i].description.lineType.toLowerCase();
                      lineType[linetype](l,ctx);
                  }
                  else{lines[l]=true}
              }
              if(i==this.hover){
                  ctx.beginPath();
                  ctx.fillStyle='rgba(0,255,0,0.5)';
                  ctx.fillRect(b[i].description.posX,b[i].description.posY,200,20);
                  if(this.portHover){
//                      console.log(this.portHover);
                      let type = '';
                      if(this.portHover.type=='in'){type = 'inputPorts';}else{type = 'outPorts';}
//                      console.log('?',b[i].description[type][this.portHover.index].color);
                      let prt = b[i].description[type][this.portHover.index];
                      ctx.fillStyle='rgba('+prt.color.r+','+prt.color.g+','+prt.color.b+',0.5)';
                      let rect = prt.rect;
                      ctx.fillRect(b[i].description.posX+rect.x,b[i].description.posY+rect.y,rect.width,rect.height);
                      ctx.strokeStyle='green';
                      ctx.lineWidth = 3;
//                      console.log(b[i].description.posX,b[i].description.posX+prt.cconnectionX);
                      ctx.arc(b[i].description.posX+prt.connectionX,b[i].description.posY+prt.connectionY,3,0,2*Math.PI,true);
                      ctx.stroke();
                  }
                  ctx.closePath();
              }
              i = blocks.range.block[i].next;
          }while(i!=null);//blocks.range.last);
      },
      drawLine: function(o){
          
      },
      rgb: function(o){
        try {
            if (typeof o === 'object'){
//                s='rgba('+o.r+', '+o.g+', '+o.b+', 0.86'+')';
                let s='#', ch='';    
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
    },
    primitives: {
        addHoverArea           : function(){},
        addSelectionArea       : function(){},
        drawEllipse            : function(o,ctx){
            let x = o.posX+o.x, y=o.posY+o.y;
            ctx.moveTo(o.posX,o.posY+o.height/2);
            ctx.bezierCurveTo(x,y,x+o.width,y,x+o.width,y+o.height/2);
            ctx.bezierCurveTo(x+o.width,y+o.height,x,y+o.height,x,y+o.height/2);
            ctx.fill();
        },
        drawImage              : function(o){
//var s = '\n\
//    ctx.beginPath();\n\
//    var image = new Image();\n\
//    var th = this;\n\
//    //image.onload = function()\n\
//    //{\n\
//    //}\n\
//    image.src = "./img/'+o.image_name+'";\n\
//    console.log(th.posX);\n\
//    //while(image.width!=0){}\n\
//    ctx.drawImage(image, th.posX+ctxOpts.x+'+o.x+', th.posY+ctxOpts.y+'+o.y+');\n\
//';
//return s;
        },
        drawLine               : function(o){
//            var s= 'ctx.lineCap="round";ctx.moveTo(this.posX+600+'+o.x1+',this.posY+200+'+o.y1+');ctx.lineTo(this.posX+600+'+o.x2+',this.posY+200+'+o.y2+');ctx.stroke();ctx.closePath()';
//            return s;
        },
        drawRoundedRect        : function(o){
//            return 'ctx.strokeStyle=cl;ctx.rect( this.posX+ctxOpts.x+'+o.x+', this.posY+ctxOpts.y+'+o.y+', '+o.width+', '+o.height+');ctx.stroke();';
        },
        drawText               : function(o,ctx){
            ctx.textBaseline = "top";
            ctx.fillText( o.text, o.posX+o.x+3, o.posY+o.y+3);
        },
        fillRect               : function(o,ctx){
            ctx.fillRect(o.posX+o.x,o.posY+o.y,o.width,o.height);
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
        SetColor               : function(o,ctx){
            let cl =graph.rgb(o);
            ctx.fillStyle = cl;
            ctx.strokeStyle = cl;
//            console.log(ctx.fillStyle);
//          return this.rgb(o);
        },
        setFont                : function(o,ctx){
            let italic = (o.italic)?"italic ":"";
            ctx.font = '"'+italic+o.size+'px '+o.family+'";';
        },
        setPenWidth            : function(o,ctx){
            ctx.lineWidth = o.width;
        },
        setInputBoundingRect   : function(){},
        setInputConnectionPort : function(){},
    },
    getMousePos: function(obj){
        return {x:Math.round((obj.offsetX-this.ctxOpts.x)/this.ctxOpts.scale),y: Math.round((obj.offsetY-this.ctxOpts.y)/this.ctxOpts.scale)}
    },
    overBlock: function(pos){
//        let pos = graph.getMousePos(e);
        let num = blocks.range.last;
        let flag = false;
        let h = false;
        do{
            let bound = blocks.block[num].drawingSequence.boundingRect[0];
            let bPos = blocks.block[num].description;
            if (bPos.posX<pos.x&&bPos.posY<pos.y&&bPos.posX+bound.w>pos.x&&bPos.posY+bound.h>pos.y){flag=num;}
            else{num = blocks.range.block[num].prev;}
        }while(num!=null&&!flag);
        if(flag){
//            let b=blocks.block[this.hover].description;
            let b=blocks.block[flag].description;
            let ports = [];
//            ports = blocks.block[this.hover].description.inputPorts;
            ports = b.inputPorts;
            for(let i of ports){
                if(pos.x>b.posX+i.rect.x&&pos.y>b.posY+i.rect.y&&pos.x<b.posX+i.rect.width&&pos.y<b.posY+i.rect.y+i.rect.height){
                    h={type:'in',index:i.index}
                }
            }
            ports = b.outPorts;
            for(let i of ports){
                if(pos.x>b.posX+i.rect.x&&pos.y>b.posY+i.rect.y&&pos.x<b.posX+i.rect.x+i.rect.width&&pos.y<b.posY+i.rect.y+i.rect.height){
                    h={type:'out',index:i.index}
                }
            }
            
//            if(flag!=this.hover&&this.portHover!=h&&this.portHover.type!=h.type&&this.portHover.index!=h.index){
//                this.hover=flag;
//                this.portHover = h;
//                this.draw();
//            }
        }
        if(flag!=this.hover||(this.portHover!=h&&(this.portHover.type!=h.type||this.portHover.index!=h.index))){
            this.hover=flag;
            this.portHover = h;
            this.draw();
        }
        return flag;
    }
  }
    var lineType = {
        bezier: function(d,ctx){
            let source = blocks.link[d].Description.sourcePoint,
                destination = blocks.link[d].Description.destinationPoint;
            let x1 = blocks.block[source.nodeID].description.posX+blocks.block[source.nodeID].description.outPorts[source.portIndex].connectionX,
            y1 = blocks.block[source.nodeID].description.posY+blocks.block[source.nodeID].description.outPorts[source.portIndex].connectionY,
            x2 = blocks.block[destination.nodeID].description.posX+blocks.block[destination.nodeID].description.inputPorts[destination.portIndex].connectionX,
            y2 = blocks.block[destination.nodeID].description.posY+blocks.block[destination.nodeID].description.inputPorts[destination.portIndex].connectionY;
            let outColor = blocks.block[source.nodeID].description.outPorts[source.portIndex].color,
                inColor  = blocks.block[destination.nodeID].description.inputPorts[destination.portIndex].color;
            let grad = ctx.createLinearGradient(x1,y1,x2,y2);
//            console.log(graph.rgb(outColor));
//console.log(x1,y1,x2,y2);
            grad.addColorStop(0.3,graph.rgb(outColor));
            grad.addColorStop(1,graph.rgb(inColor));
            ctx.beginPath();
            ctx.strokeStyle=grad;
            ctx.lineWidth=3;
            ctx.moveTo(x1,y1);
            ctx.bezierCurveTo(x1+100,y1,x2-100,y2,x2,y2);
            ctx.stroke();
            ctx.closePath();
        },
        line: function(d){
            console.log('line');
        },
        polyLine: function(d){
            console.log('poly');
        }
    }
    var events = {
        status: '',
        pos: {x:null,y:null},
        addListeners: function(dom){
            for(let i in this.list){
                dom.addEventListener(i,this.list[i],false);
            }
        },
        list: {
            mousedown: function(e){
//                console.log(e);
                if(e.button==2||e.button==1){
                    this.status='moveContext';
                    this.pos = {x: e.offsetX, y: e.offsetY}
                }else{
                    if (graph.portHover){
                        this.status = 'createLine';
                        changeRange(graph.hover);
                        this.pos = graph.getMousePos(e);
                    }
                    else if(graph.hover){
                        this.status = 'moveBlock';
                        changeRange(graph.hover);
                        this.pos = graph.getMousePos(e);
//                        this.pos = {x: e.offsetX, y: e.offsetY}
                    }
                }
                e.preventDefault();
            },
            mouseup: function(e){
                this.status = '';
            },
            wheel: function(e){
                let delta = (e.deltaY<0)?-0.1:0.1;
                let scale = delta+graph.ctxOpts.scale;
                if(scale>0.1&&scale<3){
                    graph.ctxOpts.scale=scale;
                    let pos = graph.getMousePos(e);
                    graph.ctxOpts.x-=pos.x*delta;
                    graph.ctxOpts.y-=pos.y*delta;
                }
                graph.draw();
            },
            contextmenu: function(e){
                console.log('context');
                e.preventDefault();
            },
            mousemove: function(e){
//                console.log(e.offsetX,' ',e.offsetY);
//console.log(this.status);
                let cPos = null;
                switch(this.status){
                    case 'moveContext':
                        graph.ctxOpts.x += e.offsetX-this.pos.x;
                        graph.ctxOpts.y += e.offsetY-this.pos.y;
                        this.pos = {x: e.offsetX, y: e.offsetY}
                        graph.draw();
                        break;
                    case 'moveBlock':
                        cPos = graph.getMousePos(e);
                        blocks.block[graph.hover].description.posX+=cPos.x-this.pos.x;
                        blocks.block[graph.hover].description.posY+=cPos.y-this.pos.y;
                        this.pos = cPos;//{x: e.offsetX, y: e.offsetY}
                        graph.draw();
                        break;
                    case 'createLine':
                        cPos = graph.getMousePos(e);
                        console.log(graph.portHover);
//                        blocks.block[graph.hover].description.posX+=cPos.x-this.pos.x;
//                        blocks.block[graph.hover].description.posY+=cPos.y-this.pos.y;
                        this.pos = cPos;
//                        graph.draw();
                        break;
                    default:
                        graph.overBlock(graph.getMousePos(e));
                        break;
                }
            },
            keydown: function(e){
                console.log(e);
            },
            mouseover: function(){
//                console.log('over');
                this.focus();
            },
            mouseout: function(){
                graph.hover = false;
                graph.portHover = false;
                graph.draw();
                this.status='';
                this.blur();
            }
        }
    }
//    }

  return BlockEditor;
});

