const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (er) {
        if (er.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log(er);
        }
    }
};

module.exports = { verify };
