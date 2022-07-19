import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")

const deployRaffle: DeployFunction = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2address = networkConfig[chainId!].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId!].subscriptionId
    }

    const raffleEntranceFee = networkConfig[chainId!].raffleEntranceFee
    const gasLane = networkConfig[chainId!].gasLane
    const callbackGasLimit = networkConfig[chainId!].callbackGasLimit
    const interval = networkConfig[chainId!].keepersUpdateInterval
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: [
            vrfCoordinatorV2address,
            raffleEntranceFee,
            gasLane,
            subscriptionId,
            callbackGasLimit,
            interval,
        ],
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    log("-------------------------")
}

export default deployRaffle
deployRaffle.tags = ["all", "raffle"]
