import {createPublicClient,createWalletClient,http,getAddress,parseAbi,decodeEventLog,encodeFunctionData,keccak256,stringToHex} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {config} from './config.js';
let publicClient=null,walletClient=null;
const erc20Abi=parseAbi(['function balanceOf(address) view returns (uint256)','function approve(address spender,uint256 amount) returns (bool)']);
const escrowAbi=parseAbi([
  'function createMatch(bytes32 matchId,uint96 entryAmount,uint8 maxPlayers,uint64 joinDeadline)',
  'function joinMatch(bytes32 matchId)',
  'event EntryLocked(bytes32 indexed matchId,address indexed player,uint256 amount,uint8 seatNumber)'
]);
export function chainClient(){if(!config.chain.rpcUrl)throw Object.assign(new Error('chain_rpc_not_configured'),{status:503});if(!publicClient)publicClient=createPublicClient({transport:http(config.chain.rpcUrl)});return publicClient}
function signer(){const pk=process.env.MATCHMAKER_SIGNER_PRIVATE_KEY||'';if(!pk)throw Object.assign(new Error('matchmaker_signer_not_configured'),{status:503});return privateKeyToAccount(pk.startsWith('0x')?pk:`0x${pk}`)}
function chainWalletClient(){if(!walletClient)walletClient=createWalletClient({account:signer(),transport:http(config.chain.rpcUrl)});return walletClient}
export function normalizeAddress(address){return getAddress(address)}
export function matchKey(matchId){return keccak256(stringToHex(String(matchId)))}
export async function tokenBalance(address){if(!config.chain.stablecoinAddress)throw Object.assign(new Error('stablecoin_not_configured'),{status:503});return chainClient().readContract({address:normalizeAddress(config.chain.stablecoinAddress),abi:erc20Abi,functionName:'balanceOf',args:[normalizeAddress(address)]})}
export async function transactionReceipt(hash){return chainClient().getTransactionReceipt({hash})}
export async function createEscrowMatch({matchId,entryAmountAtomic,maxPlayers=12,joinDeadline}){
  if(!config.chain.escrowAddress||!config.chain.stablecoinAddress)throw Object.assign(new Error('escrow_not_configured'),{status:503});
  const hash=await chainWalletClient().writeContract({address:normalizeAddress(config.chain.escrowAddress),abi:escrowAbi,functionName:'createMatch',args:[matchKey(matchId),BigInt(entryAmountAtomic),maxPlayers,BigInt(joinDeadline)]});
  const receipt=await chainClient().waitForTransactionReceipt({hash,confirmations:1});if(receipt.status!=='success')throw new Error('escrow_create_match_failed');return hash;
}
export function buildEntryTransactions({matchId,entryAmountAtomic,from}){
  const escrow=normalizeAddress(config.chain.escrowAddress),token=normalizeAddress(config.chain.stablecoinAddress),sender=normalizeAddress(from);
  return [
    {kind:'approve',from:sender,to:token,value:'0x0',data:encodeFunctionData({abi:erc20Abi,functionName:'approve',args:[escrow,BigInt(entryAmountAtomic)]})},
    {kind:'join',from:sender,to:escrow,value:'0x0',data:encodeFunctionData({abi:escrowAbi,functionName:'joinMatch',args:[matchKey(matchId)]})}
  ];
}
export async function verifyEntryLocked({txHash,matchId,player,expectedAmountAtomic}){
  const receipt=await chainClient().getTransactionReceipt({hash:txHash});if(receipt.status!=='success')throw Object.assign(new Error('entry_transaction_failed'),{status:409});
  const escrow=normalizeAddress(config.chain.escrowAddress).toLowerCase(),expectedPlayer=normalizeAddress(player).toLowerCase(),expectedMatch=matchKey(matchId).toLowerCase();
  for(const log of receipt.logs){if(String(log.address).toLowerCase()!==escrow)continue;try{const d=decodeEventLog({abi:escrowAbi,data:log.data,topics:log.topics});if(d.eventName!=='EntryLocked')continue;const a=d.args;if(String(a.matchId).toLowerCase()===expectedMatch&&String(a.player).toLowerCase()===expectedPlayer&&BigInt(a.amount)===BigInt(expectedAmountAtomic))return {ok:true,logIndex:Number(log.logIndex??0),blockNumber:receipt.blockNumber.toString()}}catch{}}
  throw Object.assign(new Error('verified_entry_event_not_found'),{status:409});
}
