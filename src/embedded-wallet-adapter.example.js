// Example browser-side adapter contract for the embedded-wallet provider you choose.
// Do NOT put provider server secrets in this file.
//
// Your provider integration should expose this object after the provider SDK is loaded:
//
// window.SkillArcadeEmbeddedWallet = {
//   async sendTransaction(tx) {
//     // tx = { to, data, value, from }
//     // Ask the signed-in user's embedded wallet to approve/sign/send it.
//     // Return either "0x...txHash" or { hash: "0x..." }.
//   }
// };
