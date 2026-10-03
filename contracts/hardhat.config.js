require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
module.exports={solidity:{version:'0.8.24',settings:{optimizer:{enabled:true,runs:200}}},networks:{testnet:{url:process.env.RPC_URL||'',accounts:process.env.DEPLOYER_PRIVATE_KEY?[process.env.DEPLOYER_PRIVATE_KEY]:[]}}};
