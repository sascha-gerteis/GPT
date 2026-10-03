const hre=require('hardhat');
async function main(){
  const {STABLECOIN_ADDRESS,TREASURY_ADDRESS,MATCHMAKER_ADDRESS,RESULT_SIGNER_ADDRESS}=process.env;
  if(!STABLECOIN_ADDRESS||!TREASURY_ADDRESS||!MATCHMAKER_ADDRESS||!RESULT_SIGNER_ADDRESS)throw new Error('Missing deployment addresses');
  const [deployer]=await hre.ethers.getSigners();
  const F=await hre.ethers.getContractFactory('SkillArcadeEscrow');
  const c=await F.deploy(STABLECOIN_ADDRESS,TREASURY_ADDRESS,deployer.address,MATCHMAKER_ADDRESS,RESULT_SIGNER_ADDRESS);
  await c.waitForDeployment();console.log('SkillArcadeEscrow:',await c.getAddress());
}
main().catch(e=>{console.error(e);process.exitCode=1});
