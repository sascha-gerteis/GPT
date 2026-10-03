import {supabaseAdmin} from './supabase.js';
export async function requireUser(req,res,next){
  try{
    const h=req.headers.authorization||'';const token=h.startsWith('Bearer ')?h.slice(7):'';
    if(!token)return res.status(401).json({error:'authentication_required'});
    const {data,error}=await supabaseAdmin().auth.getUser(token);
    if(error||!data?.user)return res.status(401).json({error:'invalid_session'});
    req.user=data.user;req.accessToken=token;next();
  }catch(e){next(e)}
}
