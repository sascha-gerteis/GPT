(()=>{'use strict';
window.addYouMarker3D=function(THREE,group,opts={}){
  if(!THREE||!group)return;
  const radius=opts.radius||.68,labelY=opts.labelY||1.9,color=opts.color||0xfff06a;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.055,10,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.98,depthTest:false}));
  ring.rotation.x=Math.PI/2;ring.position.y=.045;ring.renderOrder=50;group.add(ring);
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=56;const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,160,56);ctx.fillStyle='rgba(16,20,28,.92)';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(22,5,116,42,18);else ctx.rect(22,5,116,42);ctx.fill();
  ctx.lineWidth=4;ctx.strokeStyle='#fff06a';ctx.stroke();ctx.fillStyle='#ffffff';ctx.font='900 25px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('YOU',80,27);
  const tex=new THREE.CanvasTexture(canvas);tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));sprite.scale.set(1.55,.54,1);sprite.position.set(0,labelY,0);sprite.renderOrder=51;group.add(sprite);
};
})();