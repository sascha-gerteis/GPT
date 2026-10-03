import crypto from 'node:crypto';
import {supabaseAdmin} from './supabase.js';

export async function joinMatch({userId,gameSlug,region='global'}){
  const {data,error}=await supabaseAdmin().rpc('join_matchmaking_service',{p_user_id:userId,p_game_slug:gameSlug,p_region:region});
  if(error)throw Object.assign(new Error(error.message),{status:400});return data;
}
export async function leaveMatch({userId,matchId}){
  const {data,error}=await supabaseAdmin().rpc('leave_matchmaking_service',{p_user_id:userId,p_match_id:matchId});
  if(error)throw Object.assign(new Error(error.message),{status:400});return data;
}
export async function issueServerTicket({userId,matchId,ttlSeconds=120}){
  const sb=supabaseAdmin();
  const {data:member}=await sb.from('match_players').select('user_id').eq('match_id',matchId).eq('user_id',userId).maybeSingle();
  if(!member)throw Object.assign(new Error('not_a_match_participant'),{status:403});
  const raw=crypto.randomBytes(32).toString('base64url');const hash=crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt=new Date(Date.now()+ttlSeconds*1000).toISOString();
  const {error}=await sb.from('match_server_tickets').insert({match_id:matchId,user_id:userId,token_hash:hash,expires_at:expiresAt});
  if(error)throw new Error(error.message);return {ticket:raw,expiresAt};
}
export async function consumeServerTicket(raw){
  const sb=supabaseAdmin();const hash=crypto.createHash('sha256').update(raw).digest('hex');
  const {data,error}=await sb.from('match_server_tickets').select('id,match_id,user_id,expires_at,consumed_at').eq('token_hash',hash).maybeSingle();
  if(error||!data)throw new Error('invalid_ticket');if(data.consumed_at||Date.parse(data.expires_at)<=Date.now())throw new Error('expired_ticket');
  await sb.from('match_server_tickets').update({consumed_at:new Date().toISOString()}).eq('id',data.id);return data;
}
