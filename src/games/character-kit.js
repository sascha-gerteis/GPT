(()=>{
'use strict';
const COLORS=[0xffd84e,0xff5f83,0x55d6b0,0x53c8ff,0x9f7cff,0xff8a4f,0x77dd67,0x42d1d6,0xffb347,0xe66cff,0x6f8cff,0xff6b57];
const ACCENTS=[0x1b2333,0xffffff,0x163c37,0x122f42,0x2c2054,0x4b2718,0x1b3c1c,0x123b42,0x533514,0x451d4d,0x1d2f58,0x4d1d18];
function make(THREE,i,opts={}){
  const scale=opts.scale||1, compact=!!opts.compact;
  const color=(opts.colors&&opts.colors[i])??COLORS[i%COLORS.length], accent=ACCENTS[i%ACCENTS.length];
  const g=new THREE.Group();g.scale.setScalar(scale);
  const main=new THREE.MeshStandardMaterial({color,roughness:.47,metalness:.05});
  const dark=new THREE.MeshStandardMaterial({color:accent,roughness:.56,metalness:.12});
  const white=new THREE.MeshStandardMaterial({color:0xf5f7ff,roughness:.6});
  const glow=new THREE.MeshStandardMaterial({color:0x9cf7ff,emissive:0x42cfe8,emissiveIntensity:.6,roughness:.35});
  const skinY=compact?.53:.78, headY=compact?.92:1.36;
  const body=new THREE.Mesh(new THREE.SphereGeometry(compact?.34:.48,18,14),main);body.scale.set(.9,1.1,.8);body.position.y=skinY;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(compact?.23:.34,18,14),main);head.position.y=headY;head.scale.y=.94;g.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(compact?.3:.44,compact?.1:.16,.075),white);visor.position.set(0,headY+.02,compact?.2:.31);g.add(visor);
  const eyeGeo=new THREE.SphereGeometry(compact?.024:.032,8,6);const eyeL=new THREE.Mesh(eyeGeo,dark),eyeR=eyeL.clone();eyeL.position.set(compact?-.07:-.1,headY+.02,compact?.244:.355);eyeR.position.x=-eyeL.position.x;g.add(eyeL,eyeR);
  const armGeo=new THREE.CylinderGeometry(compact?.055:.085,compact?.07:.105,compact?.38:.56,9);
  const leftArm=new THREE.Mesh(armGeo,main),rightArm=leftArm.clone();leftArm.position.set(compact?-.31:-.46,skinY,0);rightArm.position.x=-leftArm.position.x;leftArm.rotation.z=-.13;rightArm.rotation.z=.13;g.add(leftArm,rightArm);
  const legGeo=new THREE.CylinderGeometry(compact?.06:.09,compact?.075:.115,compact?.34:.5,9);
  const leftLeg=new THREE.Mesh(legGeo,dark),rightLeg=leftLeg.clone();leftLeg.position.set(compact?-.12:-.18,compact?.17:.25,0);rightLeg.position.x=-leftLeg.position.x;g.add(leftLeg,rightLeg);
  // Different silhouettes give each runner an identity instead of color-only swaps.
  switch(i%6){
    case 0:{ // hero scarf
      const scarf=new THREE.Mesh(new THREE.BoxGeometry(compact?.36:.5,.08,.12),glow);scarf.position.set(0,headY-.22,-.03);g.add(scarf);break;
    }
    case 1:{ // antenna
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,compact?.26:.36,7),dark);stem.position.set(.08,headY+(compact?.25:.38),0);const tip=new THREE.Mesh(new THREE.SphereGeometry(compact?.06:.075,8,6),glow);tip.position.set(.08,headY+(compact?.4:.57),0);g.add(stem,tip);break;
    }
    case 2:{ // headband
      const band=new THREE.Mesh(new THREE.TorusGeometry(compact?.23:.34,.035,7,20),white);band.rotation.x=Math.PI/2;band.position.y=headY+.08;g.add(band);break;
    }
    case 3:{ // backpack
      const pack=new THREE.Mesh(new THREE.BoxGeometry(compact?.28:.4,compact?.34:.5,compact?.16:.22),dark);pack.position.set(0,skinY+.04,compact?-.27:-.38);g.add(pack);break;
    }
    case 4:{ // shoulder pads
      const sg=new THREE.BoxGeometry(compact?.13:.18,compact?.1:.14,compact?.18:.24);const a=new THREE.Mesh(sg,white),b=a.clone();a.position.set(compact?-.3:-.45,skinY+.18,0);b.position.x=-a.position.x;g.add(a,b);break;
    }
    case 5:{ // cap/crest
      const cap=new THREE.Mesh(new THREE.BoxGeometry(compact?.35:.5,.09,compact?.27:.38),dark);cap.position.set(0,headY+(compact?.19:.29),-.02);const brim=new THREE.Mesh(new THREE.BoxGeometry(compact?.24:.34,.04,compact?.15:.2),dark);brim.position.set(0,headY+(compact?.16:.25),compact?.18:.27);g.add(cap,brim);break;
    }
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  if(i===0)window.addYouMarker3D?.(THREE,g,{radius:opts.markerRadius||(compact?.52:.72),labelY:opts.labelY||(compact?1.28:2.08)});
  g.userData.limbs={leftArm,rightArm,leftLeg,rightLeg,body,head};
  g.userData.a=leftLeg;g.userData.bb=rightLeg;g.userData.la=leftLeg;g.userData.lb=rightLeg;
  g.userData.characterIndex=i;
  return g;
}
window.SkillArcadeCharacters={make,COLORS};
})();
