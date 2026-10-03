// Example browser-side adapter contract for the embedded-wallet provider you choose.
// Never put provider server secrets in this browser file.
//
// window.SkillArcadeEmbeddedWallet = {
//   async sendTransaction(tx) {
//     // Ask the signed-in user's embedded wallet to approve/sign/send tx.
//     // Return "0x...txHash" or { hash: "0x..." }.
//   }
// };
