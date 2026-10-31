/* Author: Lliftime. SI calculations; graphical animation is illustrative. */
(function(root){
  'use strict';
  const materials={
    copper:{name:'铜',rho:1.68e-8,alpha:.0039,n:8.5e28},
    aluminum:{name:'铝',rho:2.65e-8,alpha:.0039,n:null},
    nichrome:{name:'镍铬合金',rho:1.00e-6,alpha:.0004,n:null}
  };
  function calculate(s){
    for(const key of ['voltage','resistance','length','area','temperature','r2']) if(!Number.isFinite(s[key])) throw new RangeError('参数必须是有限数值');
    if(s.resistance<=0||s.length<=0||s.area<=0||s.r2<=0||s.temperature<20||s.temperature>100)throw new RangeError('电阻、长度、截面积必须大于零；温度限于 20–100 ℃');
    if(!materials[s.material]||!['ideal','wire'].includes(s.mode)||!['single','series','parallel'].includes(s.topology))throw new RangeError('未知的实验模型');
    const mat=materials[s.material],areaSI=s.area*1e-6;
    const rho=mat.rho*(1+mat.alpha*(s.temperature-20));
    const r1=s.mode==='wire'?rho*s.length/areaSI:s.resistance;
    const r2=s.r2;
    const totalR=s.topology==='series'?r1+r2:s.topology==='parallel'?1/(1/r1+1/r2):r1;
    const current=s.closed&&s.voltage!==0?s.voltage/totalR:0;
    const u1=!s.closed?0:s.topology==='series'?current*r1:s.voltage;
    const u2=!s.closed||s.topology==='single'?0:s.topology==='series'?current*r2:s.voltage;
    const i1=u1/r1,i2=u2/r2;
    const drift=i1===0?0:s.mode==='wire'&&mat.n!==null?Math.abs(i1)/(mat.n*1.602176634e-19*areaSI):null;
    return {r1,r2,totalR,current,u1,u2,i1,i2,p1:u1*i1,p2:u2*i2,power:current===0?0:s.voltage*current,resistorVoltage:u1,field:u1/s.length,currentDensity:i1/areaSI,drift,rho,currentDirection:Math.sign(i1),electronDirection:i1===0?0:-Math.sign(i1)};
  }
  const api={calculate,materials};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CurrentPhysics=api;
})(typeof window!=='undefined'?window:globalThis);
