const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1");
          beforeEach(async function () {
              // const accounts = await ethers.getSigners();
              // const account_1 = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async function () {
              it("sets the aggregator addresses directly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async function () {
              it("fails if you dont send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.reverted;
              });

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const fundedAmount = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(sendValue.toString(), fundedAmount.toString());
              });

              it("Adds funder to getFunders array", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunders(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("can withdraw ETH from a single founder", async function () {
                  const startingContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalContractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  assert.equal(finalContractBalance, 0);
                  assert.equal(
                      finalDeployerBalance.add(gasCost).toString(),
                      startingContractBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );
              });
              it("allows us to withdraw from multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingContractBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionResponse = await fundMe.withdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const finalContractBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const finalDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(finalContractBalance, 0);
                      assert.equal(
                          finalDeployerBalance.add(gasCost).toString(),
                          startingContractBalance
                              .add(startingDeployerBalance)
                              .toString()
                      );

                      await expect(fundMe.getFunders(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  }
              });

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];

                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted;
              });

              it("cheaper withdraw testing", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingContractBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionResponse =
                          await fundMe.cheaperWithdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const finalContractBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const finalDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(finalContractBalance, 0);
                      assert.equal(
                          finalDeployerBalance.add(gasCost).toString(),
                          startingContractBalance
                              .add(startingDeployerBalance)
                              .toString()
                      );

                      await expect(fundMe.getFunders(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  }
              });

              it("can withdraw ETH from a single founder", async function () {
                  const startingContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalContractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  assert.equal(finalContractBalance, 0);
                  assert.equal(
                      finalDeployerBalance.add(gasCost).toString(),
                      startingContractBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );
              });
          });
      });
