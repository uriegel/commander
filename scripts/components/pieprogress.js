const template = document.createElement('template')
template.innerHTML = `  
    <style>
    * { box-sizing:border-box; }

    body { 
        background-color: #000;
    }
    
    .wrapper { 
        width:$size;
        height:$size;
        margin:40px auto;
        position:relative;
        background:white;
        background-color: $mask-color;
        border-radius: 100%;
    }
    
    .pie {
        width: 50%;
        height: 100%;
        transform-origin: 100% 50%;
        position: absolute;
        background: $background-color;
    }
    
    .spinner {
        border-radius: 100% 0 0 100% / 50% 0 0 50%;
        z-index: 200;
        border-right:none;
        transition: all 1s step(1,end) ease-in-out;
        //transition: 1s ease-in-out;
    }
    
    .spinner:after {
        position:absolute;
        width:10px;
        height:10px;
        background:#fff;
        border:1px solid rgba(0,0,0,0.5);
        box-shadow: inset 0 0 3px rgba(0,0,0,0.2);
        border-radius:50%;
        top:10px;
        right:10px;   
        content:"";
        display: none;
    }
    
    .filler {
        border-radius: 0 100% 100% 0 / 0 50% 50% 0; 
        left: 50%;
        opacity: 0;
        z-index: 100;
        border-left: none;
        opacity: 1;
    }
    
    .mask {
        width: 50%;
        height: 100%;
        border-radius: 100% 0 0 100% / 50% 0 0 50%;
        position: absolute;
        background: inherit;
        opacity: 0;
        z-index: 300;
    }    
    </style>
    <div class="wrapper">
        <div class="pie spinner"></div>
        <div class="pie filler"></div>
        <div class="mask"></div>
  </div>
`
class PdfViewer extends HTMLElement {
    constructor() {
        super()
    }
}

(function(){
    var _fn = {},
        fn  = {};
    
    _fn.prog = document.getElementById('progress');  
    _fn.spin = document.querySelectorAll('.spinner')[0];
    _fn.fill = document.querySelectorAll('.filler')[0];
    _fn.mask = document.querySelectorAll('.mask')[0];
    
    fn.change = function(){
      
      if(_fn.prog.value < 0 || _fn.prog.value > 100){
        _fn.prog.value = 0;
      }
      
      var deg = _fn.prog.value * 3.6;
      
      if(_fn.prog.value > 50) {
        _fn.fill.style.opacity = '1';
        _fn.mask.style.opacity = '0';
      } else {
        _fn.fill.style.opacity = '0';
        _fn.mask.style.opacity = '1';
      }
      
      _fn.spin.style.transform = 'rotate('+deg+'deg)';
    }
  
    _fn.prog.onchange = function(){
      fn.change();
    }
    
    fn.change();
   })()

        