from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
src=root/'src'
checks=[]
def ok(name,cond):
    checks.append((name,bool(cond)))
launch=(src/'launch-config.js').read_text()
live=(src/'live-config.js').read_text()
core=(src/'live-core.js').read_text()
index=(src/'index.html').read_text()
migration=(root/'supabase/migrations/002_live_wallet_escrow_matchmaking.sql').read_text()
contract=(root/'contracts/contracts/SkillArcadeEscrow.sol').read_text()
server=(root/'server/src/index.js').read_text()
ok('real money launch flag remains false',"realMoneyEnabled: false" in launch)
ok('cash mode gate starts false',re.search(r'cashMode:\s*false',live))
ok('deposit gate starts false',re.search(r'deposits:\s*false',live))
ok('withdrawal gate starts false',re.search(r'withdrawals:\s*false',live))
ok('paid matchmaking gate starts false',re.search(r'paidMatchmaking:\s*false',live))
ok('stablecoin address is blank by default',"address: ''" in live)
ok('escrow address is blank by default',"escrowContractAddress: ''" in live)
ok('live UI wired', 'live-core.js' in index and 'live-core.css' in index and 'live-config.js' in index)
ok('online account layer preserved','online.js' in index and 'online-config.js' in index)
ok('no service role secret in browser', 'SERVICE_ROLE' not in (live+core).upper())
ok('wallet schema present','wallet_accounts' in migration and 'wallet_deposits' in migration and 'wallet_withdrawals' in migration)
ok('paid reservation flow present','prepare_paid_match' in migration and 'confirm_paid_entry' in migration)
ok('service-only paid RPCs','grant execute on function public.prepare_paid_match' in migration and 'to service_role' in migration)
ok('contract uses reentrancy guard','ReentrancyGuard' in contract and 'nonReentrant' in contract)
ok('contract verifies result signer','resultSigner' in contract and 'ECDSA.recover' in contract)
ok('contract supports refunds','claimRefund' in contract and 'cancelExpiredMatch' in contract)
ok('server verifies auth','requireUser' in server)
ok('server has WS tickets','consumeServerTicket' in server)
ok('server never accepts client positions','sanitizeInput' in server and 'position' not in re.sub(r'//.*','',server))
failed=[n for n,v in checks if not v]
for n,v in checks: print(('PASS' if v else 'FAIL')+': '+n)
if failed:
    print(f'FAILED {len(failed)} checks')
    sys.exit(1)
print(f'PASS: {len(checks)} live-infrastructure checks')
